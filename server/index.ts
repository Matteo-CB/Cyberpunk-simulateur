import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import next from 'next';
import { GameEngine } from '@/lib/engine/GameEngine';
import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import { getOpponent } from '@/lib/engine/types';
import { PrismaClient } from '@prisma/client';
import { calculateElo, getLeagueTier } from '@/lib/elo/elo';
import { syncDiscordRole } from '@/lib/discord/roleSync';
import { sendRankUpWebhook, sendRankDownWebhook, sendPlacementCompletedWebhook } from '@/lib/discord/rankUpWebhook';

const prisma = new PrismaClient();

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || 'localhost';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

const RANKED_TURN_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const CASUAL_TURN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// CORS origins: allow localhost in dev plus the configured socket URL
const allowedOrigins: string[] = [
  `http://localhost:${port}`,
  `http://localhost:3000`,
  `http://${hostname}:${port}`,
];
if (process.env.NEXT_PUBLIC_SOCKET_URL) {
  allowedOrigins.push(process.env.NEXT_PUBLIC_SOCKET_URL);
}
if (process.env.NEXT_PUBLIC_APP_URL) {
  allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface RoomData {
  code: string;
  hostId: string;
  hostUsername: string;
  guestId: string | null;
  guestUsername: string | null;
  gameState: unknown | null;
  createdAt: number;
  isPrivate: boolean;
  isRanked: boolean;
  gameMode: 'casual' | 'ranked';
  gameSaved: boolean;
  hasActedThisTurn: { player1: boolean; player2: boolean };
  lastActivePlayer: PlayerID | null;
  deckReady: { player1: boolean; player2: boolean };
}

interface ChatPayload {
  roomCode: string;
  userId: string;
  username: string;
  message: string;
  isEmote?: boolean;
}

interface GameActionPayload {
  roomCode: string;
  action: unknown;
  player: 'player1' | 'player2';
}

interface GameStatePayload {
  roomCode: string;
  gameState: unknown;
}

// ------------------------------------------------------------------
// In-memory stores
// ------------------------------------------------------------------

const rooms = new Map<string, RoomData>();
const socketToRoom = new Map<string, string>();
const socketToUser = new Map<string, { userId: string; username: string }>();
const turnTimers = new Map<string, NodeJS.Timeout>();

let ioRef: any = null;

function broadcastRoomList() {
  if (!ioRef) return;
  const publicRooms = Array.from(rooms.values())
    .filter((r: RoomData) => !r.isPrivate && !r.guestId)
    .map((r: RoomData) => ({
      code: r.code,
      hostUsername: r.hostUsername,
      gameMode: r.gameMode,
      isRanked: r.isRanked,
      createdAt: r.createdAt,
    }));
  ioRef.emit('room:list-update', publicRooms);
}

// ------------------------------------------------------------------
// Turn Timer Management
// ------------------------------------------------------------------

function clearTurnTimer(roomCode: string) {
  const timer = turnTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomCode);
  }
}

function startTurnTimer(roomCode: string, io: SocketIOServer) {
  clearTurnTimer(roomCode);
  const room = rooms.get(roomCode);
  if (!room || !room.gameState) return;

  const state = room.gameState as GameState;
  if (state.phase === 'gameOver' || state.phase === 'setup') return;

  // Determine timeout duration
  const duration = room.isRanked ? RANKED_TURN_TIMEOUT_MS : CASUAL_TURN_TIMEOUT_MS;
  const activePlayer = state.activePlayer;
  const timerStart = Date.now();

  // Track turn change — reset hasActedThisTurn when active player changes
  if (room.lastActivePlayer !== activePlayer) {
    room.hasActedThisTurn[activePlayer] = false;
    room.lastActivePlayer = activePlayer;
  }

  // Notify clients
  io.to(roomCode).emit('game:timer-start', {
    activePlayer,
    duration,
    startedAt: timerStart,
  });

  const timer = setTimeout(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom || !currentRoom.gameState || currentRoom.gameSaved) return;

    const currentState = currentRoom.gameState as GameState;
    if (currentState.phase === 'gameOver') return;
    if (currentState.activePlayer !== activePlayer) return; // Turn already changed

    const hasActed = currentRoom.hasActedThisTurn[activePlayer];

    if (!hasActed) {
      // Player did NOTHING for entire timer → FORFEIT
      console.log(`[timer] ${activePlayer} timed out with no action in room ${roomCode} — forfeit`);
      try {
        const newState = GameEngine.applyAction(currentState, activePlayer, { type: 'FORFEIT', reason: 'timeout' });
        currentRoom.gameState = newState;
        io.to(roomCode).emit('game:state-update', { gameState: newState, timestamp: Date.now() });
        io.to(roomCode).emit('game:timer-expired', { player: activePlayer, forfeit: true });
        if (newState.phase === 'gameOver') {
          handleGameOver(currentRoom, newState, io);
        }
      } catch (err) {
        console.error('[timer] Error applying forfeit:', err);
      }
    } else {
      // Player acted but didn't finish → pass turn
      console.log(`[timer] ${activePlayer} timed out (acted) in room ${roomCode} — passing turn`);
      let newState = currentState;
      try {
        // Clear any pending actions first
        newState = { ...newState, pendingActions: [], pendingEffects: [], effectAnimationQueue: [] } as GameState;

        // Force through phases to end the turn
        if (newState.phase === 'defense') {
          // Auto-decline defense
          newState = GameEngine.applyAction(newState, getOpponent(activePlayer), { type: 'DECLINE_DEFENSE' });
        }
        if (newState.phase === 'ready') {
          // Auto-choose first die
          const playerState = activePlayer === 'player1' ? newState.player1 : newState.player2;
          if (playerState.fixerArea.length > 0) {
            newState = GameEngine.applyAction(newState, activePlayer, { type: 'CHOOSE_GIG_DIE', dieIndex: 0 });
          }
        }
        if (newState.phase === 'play') {
          newState = GameEngine.applyAction(newState, activePlayer, { type: 'END_PLAY_PHASE' });
        }
        if (newState.phase === 'attack') {
          newState = GameEngine.applyAction(newState, activePlayer, { type: 'END_ATTACK_PHASE' });
        }
      } catch (err) {
        console.error('[timer] Error forcing turn end, falling back to forfeit:', err);
        try {
          newState = GameEngine.applyAction(currentState, activePlayer, { type: 'FORFEIT', reason: 'timeout' });
        } catch (err2) {
          console.error('[timer] Forfeit also failed:', err2);
          return;
        }
      }

      currentRoom.gameState = newState;
      io.to(roomCode).emit('game:state-update', { gameState: newState, timestamp: Date.now() });
      io.to(roomCode).emit('game:timer-expired', { player: activePlayer, forfeit: false });

      if (newState.phase === 'gameOver') {
        handleGameOver(currentRoom, newState, io);
      } else {
        // Start timer for next player
        startTurnTimer(roomCode, io);
      }
    }
  }, duration);

  turnTimers.set(roomCode, timer);
}

// ------------------------------------------------------------------
// Game-over Detection & Saving
// ------------------------------------------------------------------

async function handleGameOver(room: RoomData, state: GameState, io: SocketIOServer) {
  if (room.gameSaved) return;
  room.gameSaved = true;
  clearTurnTimer(room.code);

  const winnerId = state.winner === 'player1' ? room.hostId
                 : state.winner === 'player2' ? room.guestId
                 : null;
  const p1Score = state.player1.gigArea.length;
  const p2Score = state.player2.gigArea.length;

  console.log(`[game-over] Room ${room.code}: winner=${state.winner}, reason=${state.winReason}, ranked=${room.isRanked}`);

  try {
    // Create game record
    const game = await prisma.game.create({
      data: {
        player1Id: room.hostId,
        player2Id: room.guestId,
        isAiGame: false,
        isRanked: room.isRanked,
        gameState: { turn: state.turn, winReason: state.winReason },
        status: 'in_progress',
      },
      include: { player1: true, player2: true },
    });

    let eloChange: number | null = null;

    if (winnerId && game.player1 && game.player2) {
      const p1Result = winnerId === room.hostId ? 'win' as const : winnerId === room.guestId ? 'loss' as const : 'draw' as const;
      const p2Result = winnerId === room.guestId ? 'win' as const : winnerId === room.hostId ? 'loss' as const : 'draw' as const;
      const oldP1Elo = game.player1.elo;
      const oldP2Elo = game.player2.elo;

      if (room.isRanked) {
        const p1Elo = calculateElo(game.player1.elo, game.player2.elo, p1Result);
        const p2Elo = calculateElo(game.player2.elo, game.player1.elo, p2Result);
        eloChange = Math.abs(p1Elo.change);

        console.log(`[game-over] ELO: ${game.player1.username} ${oldP1Elo}->${p1Elo.newElo}, ${game.player2.username} ${oldP2Elo}->${p2Elo.newElo}`);

        // Placement + Discord sync for each player
        const playerIds = [room.hostId, room.guestId!];
        const results = [p1Result, p2Result];
        const oldElos = [oldP1Elo, oldP2Elo];
        const newElos = [p1Elo.newElo, p2Elo.newElo];
        const eloValues = [p1Elo.newElo, p2Elo.newElo];

        for (let idx = 0; idx < playerIds.length; idx++) {
          const pid = playerIds[idx];
          const res = results[idx];

          // Read current values first to avoid MongoDB increment on missing fields
          const current = await prisma.user.findUnique({
            where: { id: pid },
            select: { gamesPlayed: true, wins: true, losses: true, draws: true },
          });
          const curGP = current?.gamesPlayed ?? 0;
          const curW = current?.wins ?? 0;
          const curL = current?.losses ?? 0;
          const curD = current?.draws ?? 0;

          // Single update with explicit values (not increment — avoids MongoDB missing field bug)
          const updated = await prisma.user.update({
            where: { id: pid },
            data: {
              elo: eloValues[idx],
              gamesPlayed: curGP + 1,
              wins: res === 'win' ? curW + 1 : curW,
              losses: res === 'loss' ? curL + 1 : curL,
              draws: res === 'draw' ? curD + 1 : curD,
            },
            select: { gamesPlayed: true, placementCompleted: true, discordId: true, elo: true, username: true },
          });
          console.log(`[game-over] ${updated.username}: elo=${updated.elo}, gamesPlayed=${updated.gamesPlayed}`);

          if (updated.gamesPlayed >= 5 && !updated.placementCompleted) {
            await prisma.user.update({ where: { id: pid }, data: { placementCompleted: true } });
            const placedTier = getLeagueTier(newElos[idx]);
            console.log(`[game-over] ${updated.username} completed placement -> ${placedTier.name}`);
            try {
              if (updated.discordId) await syncDiscordRole(updated.discordId, updated.elo, true);
              await sendPlacementCompletedWebhook(updated.discordId || null, updated.username, placedTier, updated.elo);
            } catch (e) { console.error('[game-over] Placement webhook error:', e); }
            continue;
          }

          if (updated.placementCompleted) {
            try {
              const oldTier = getLeagueTier(oldElos[idx]);
              const newTier = getLeagueTier(newElos[idx]);
              if (updated.discordId) await syncDiscordRole(updated.discordId, updated.elo, true);
              if (oldTier.key !== newTier.key) {
                if (newElos[idx] > oldElos[idx]) {
                  await sendRankUpWebhook(updated.discordId || null, updated.username, newTier, updated.elo, oldTier.key);
                } else {
                  await sendRankDownWebhook(updated.discordId || null, updated.username, newTier, updated.elo, oldTier.key);
                }
              }
            } catch (e) { console.error('[game-over] Discord sync error:', e); }
          }
        }
      } else {
        // Casual: no stats, no ELO, no placement — just save the game record
      }
    }

    // Complete the game record
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'completed',
        winnerId: winnerId || null,
        player1Score: p1Score,
        player2Score: p2Score,
        eloChange,
        completedAt: new Date(),
      },
    });

    // Broadcast to clients — send per-player ELO changes
    io.to(room.code).emit('game:ended', {
      winnerId,
      winReason: state.winReason,
      player1Score: p1Score,
      player2Score: p2Score,
      // Per-player ELO changes (signed: positive = gained, negative = lost)
      player1EloChange: room.isRanked && winnerId ? (winnerId === room.hostId ? eloChange : eloChange ? -eloChange : 0) : null,
      player2EloChange: room.isRanked && winnerId ? (winnerId === room.guestId ? eloChange : eloChange ? -eloChange : 0) : null,
      isRanked: room.isRanked,
    });

    console.log(`[game-over] Game saved: id=${game.id}, ranked=${room.isRanked}, eloChange=${eloChange ?? 'N/A'}`);
  } catch (err) {
    console.error('[game-over] Error saving game:', err);
  }
}

// ------------------------------------------------------------------
// Server Setup
// ------------------------------------------------------------------

async function startServer() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const expressApp = express();

  // Parse JSON for API routes handled by Express
  expressApp.use(express.json());

  // Health check endpoint
  expressApp.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      rooms: rooms.size,
      connections: io.engine.clientsCount,
    });
  });

  // Delegate all other requests to Next.js
  expressApp.use((req, res) => {
    return handle(req, res);
  });

  const httpServer = createServer(expressApp);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  ioRef = io;

  // ----------------------------------------------------------------
  // Socket.IO Event Handlers
  // ----------------------------------------------------------------

  io.on('connection', (socket: Socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // --- Authentication ---
    socket.on(
      'auth',
      (data: { userId: string; username: string }, ack?: (res: { ok: boolean }) => void) => {
        socketToUser.set(socket.id, {
          userId: data.userId,
          username: data.username,
        });
        if (ack) ack({ ok: true });
      }
    );

    // --- Room: Create ---
    socket.on(
      'room:create',
      (
        data: {
          roomCode: string;
          userId: string;
          username: string;
          isPrivate?: boolean;
          isRanked?: boolean;
          gameMode?: 'casual' | 'ranked';
        },
        ack?: (res: { ok: boolean; error?: string }) => void
      ) => {
        const { roomCode, userId, username } = data;

        if (rooms.has(roomCode)) {
          if (ack) ack({ ok: false, error: 'Room already exists' });
          return;
        }

        const room: RoomData = {
          code: roomCode,
          hostId: userId,
          hostUsername: username,
          guestId: null,
          guestUsername: null,
          gameState: null,
          createdAt: Date.now(),
          isPrivate: data.isPrivate || false,
          isRanked: data.isRanked || false,
          gameMode: data.gameMode || 'casual',
          gameSaved: false,
          hasActedThisTurn: { player1: false, player2: false },
          lastActivePlayer: null,
          deckReady: { player1: false, player2: false },
        };

        rooms.set(roomCode, room);
        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);
        socketToUser.set(socket.id, { userId, username });

        io.to(roomCode).emit('room:updated', room);
        broadcastRoomList();
        if (ack) ack({ ok: true });

        console.log(`[socket] Room created: ${roomCode} by ${username} (${data.gameMode || 'casual'})`);
      }
    );

    // --- Room: List (public rooms + active games) ---
    socket.on('room:list', () => {
      const publicRooms = Array.from(rooms.values())
        .filter((r) => !r.isPrivate && !r.guestId)
        .map((r) => ({
          code: r.code,
          hostUsername: r.hostUsername,
          gameMode: r.gameMode,
          isRanked: r.isRanked,
          createdAt: r.createdAt,
        }));
      const activeGames = Array.from(rooms.values())
        .filter((r) => r.guestId && r.gameState)
        .map((r) => ({
          code: r.code,
          player1: r.hostUsername,
          player2: r.guestUsername,
          gameMode: r.gameMode,
          isRanked: r.isRanked,
          isPrivate: r.isPrivate,
        }));
      socket.emit('room:list-update', publicRooms);
      socket.emit('games:list-update', activeGames);
    });

    // --- Room: Join ---
    socket.on(
      'room:join',
      (
        data: {
          roomCode: string;
          userId: string;
          username: string;
        },
        ack?: (res: { ok: boolean; error?: string; room?: RoomData }) => void
      ) => {
        const { roomCode, userId, username } = data;
        const room = rooms.get(roomCode);

        if (!room) {
          if (ack) ack({ ok: false, error: 'Room not found' });
          return;
        }

        // Join as player
        if (room.guestId && room.guestId !== userId) {
          if (ack) ack({ ok: false, error: 'Room is full' });
          return;
        }

        // Allow rejoin
        if (room.hostId === userId || room.guestId === userId) {
          socket.join(roomCode);
          socketToRoom.set(socket.id, roomCode);
          socketToUser.set(socket.id, { userId, username });
          io.to(roomCode).emit('room:updated', room);
          if (ack) ack({ ok: true, room });
          return;
        }

        room.guestId = userId;
        room.guestUsername = username;
        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);
        socketToUser.set(socket.id, { userId, username });

        io.to(roomCode).emit('room:updated', room);
        io.to(roomCode).emit('room:player-joined', {
          userId,
          username,
        });
        if (ack) ack({ ok: true, room });

        console.log(`[socket] ${username} joined room ${roomCode}`);
      }
    );

    // --- Room: Leave ---
    socket.on('room:leave', (data?: { roomCode?: string }) => {
      const roomCode = data?.roomCode || socketToRoom.get(socket.id);
      if (!roomCode) return;

      handleLeaveRoom(socket, roomCode);
    });

    // --- Game: Deck Ready ---
    socket.on('game:deck-ready', (data: { roomCode: string; player: 'player1' | 'player2' }) => {
      const room = rooms.get(data.roomCode);
      if (!room) return;

      room.deckReady[data.player] = true;
      console.log(`[socket] ${data.player} deck ready in room ${data.roomCode}. P1=${room.deckReady.player1}, P2=${room.deckReady.player2}`);

      // Notify all clients
      io.to(data.roomCode).emit('game:deck-status', {
        player1Ready: room.deckReady.player1,
        player2Ready: room.deckReady.player2,
      });

      // When both ready, tell the host to create the game
      if (room.deckReady.player1 && room.deckReady.player2) {
        io.to(data.roomCode).emit('game:both-ready');
      }
    });

    // --- Game: Action ---
    socket.on(
      'game:action',
      (payload: GameActionPayload, ack?: (res: { ok: boolean }) => void) => {
        const { roomCode, action, player } = payload;
        const room = rooms.get(roomCode);
        if (!room) {
          if (ack) ack({ ok: false });
          return;
        }

        // Apply the action via GameEngine if there is game state
        if (room.gameState) {
          try {
            const oldState = room.gameState as GameState;
            const newState = GameEngine.applyAction(
              oldState,
              player as PlayerID,
              action as GameAction
            );
            room.gameState = newState;

            // Track that this player acted
            room.hasActedThisTurn[player as PlayerID] = true;

            // Broadcast updated state to ALL clients in the room
            io.to(roomCode).emit('game:state-update', {
              gameState: newState,
              timestamp: Date.now(),
            });

            // Check for game over
            if (newState.phase === 'gameOver') {
              handleGameOver(room, newState, io);
            } else {
              // Restart timer on every action (for online games)
              if (room.guestId) {
                startTurnTimer(roomCode, io);
              }

              // Notify the player whose turn it is
              const activePlayer = newState.activePlayer;
              const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
              if (socketsInRoom) {
                for (const socketId of socketsInRoom) {
                  const userData = socketToUser.get(socketId);
                  if (userData) {
                    const isPlayer1 = room.hostId === userData.userId;
                    const socketPlayer: PlayerID = isPlayer1 ? 'player1' : 'player2';
                    if (socketPlayer === activePlayer) {
                      io.to(socketId).emit('game:your-turn', {
                        player: activePlayer,
                        phase: newState.phase,
                        turn: newState.turn,
                      });
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error(`[socket] Error applying game action in room ${roomCode}:`, err);
            // Fall back to broadcasting the raw action
            io.to(roomCode).emit('game:action-received', {
              action,
              player,
              timestamp: Date.now(),
            });
          }
        } else {
          // No game state yet, just broadcast the action
          io.to(roomCode).emit('game:action-received', {
            action,
            player,
            timestamp: Date.now(),
          });
        }

        if (ack) ack({ ok: true });
      }
    );

    // --- Game: State Update ---
    socket.on('game:state-update', (payload: GameStatePayload) => {
      const { roomCode, gameState } = payload;
      const room = rooms.get(roomCode);
      if (!room) return;

      room.gameState = gameState;
      // Broadcast to all other clients in the room
      socket.to(roomCode).emit('game:state-update', {
        gameState,
        timestamp: Date.now(),
      });

      // Start timer when game state is first set (both players present)
      if (room.guestId && gameState) {
        const state = gameState as GameState;
        if (state.phase && state.phase !== 'gameOver') {
          startTurnTimer(roomCode, io);
        }
      }
    });

    // --- Chat: Send ---
    socket.on('chat:send', (payload: ChatPayload) => {
      const { roomCode, userId, username, message, isEmote } =
        payload;

      // Basic validation
      if (!message || message.trim().length === 0) return;
      if (message.length > 500) return;

      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        roomCode,
        userId,
        username,
        message: message.trim(),
        isEmote: isEmote || false,
        timestamp: Date.now(),
      };

      // Broadcast to all clients in the room
      io.to(roomCode).emit('chat:message', chatMessage);
    });

    // --- Disconnect ---
    socket.on('disconnect', (reason) => {
      console.log(
        `[socket] Client disconnected: ${socket.id} (${reason})`
      );

      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        handleLeaveRoom(socket, roomCode);
      }

      socketToRoom.delete(socket.id);
      socketToUser.delete(socket.id);
    });
  });

  // ----------------------------------------------------------------
  // Helper: Handle leaving a room
  // ----------------------------------------------------------------

  function handleLeaveRoom(socket: Socket, roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const user = socketToUser.get(socket.id);
    socket.leave(roomCode);
    socketToRoom.delete(socket.id);

    if (user) {
      // If the guest leaves
      if (room.guestId === user.userId) {
        // Ranked game in progress → forfeit
        if (room.isRanked && room.gameState && !room.gameSaved) {
          const state = room.gameState as GameState;
          if (state.phase !== 'gameOver') {
            console.log(`[socket] Guest ${user.username} left ranked game in room ${roomCode} — forfeit`);
            try {
              const newState = GameEngine.applyAction(state, 'player2', { type: 'FORFEIT', reason: 'abandon' });
              room.gameState = newState;
              io.to(roomCode).emit('game:state-update', { gameState: newState, timestamp: Date.now() });
              handleGameOver(room, newState, io);
            } catch (err) {
              console.error('[socket] Error applying guest forfeit:', err);
            }
          }
        }

        room.guestId = null;
        room.guestUsername = null;
        io.to(roomCode).emit('room:player-left', {
          userId: user.userId,
          username: user.username,
        });
      }

      // If the host disconnects, give 15s grace period for reconnect (page navigation)
      if (room.hostId === user.userId) {
        console.log(`[socket] Host ${user.username} disconnected from room ${roomCode}, grace period 15s`);
        setTimeout(() => {
          const stillRoom = rooms.get(roomCode);
          if (!stillRoom) return; // Already deleted
          // Check if host reconnected (a new socket joined with same userId)
          let hostReconnected = false;
          for (const [sid, u] of socketToUser.entries()) {
            if (u.userId === user.userId) {
              const sr = socketToRoom.get(sid);
              if (sr === roomCode) { hostReconnected = true; break; }
            }
          }
          if (!hostReconnected) {
            // Ranked game in progress → forfeit the host
            if (stillRoom.isRanked && stillRoom.gameState && !stillRoom.gameSaved) {
              const state = stillRoom.gameState as GameState;
              if (state.phase !== 'gameOver') {
                console.log(`[socket] Host ${user.username} did not reconnect to ranked game — forfeit`);
                try {
                  const newState = GameEngine.applyAction(state, 'player1', { type: 'FORFEIT', reason: 'abandon' });
                  stillRoom.gameState = newState;
                  io.to(roomCode).emit('game:state-update', { gameState: newState, timestamp: Date.now() });
                  handleGameOver(stillRoom, newState, io);
                } catch (err) {
                  console.error('[socket] Error applying host forfeit:', err);
                }
              }
            }

            io.to(roomCode).emit('room:closed', { reason: 'Host left the room' });
            clearTurnTimer(roomCode);
            rooms.delete(roomCode);
            broadcastRoomList();
            console.log(`[socket] Room ${roomCode} closed after grace period`);
          }
        }, 15000);
        return;
      }
    }

    io.to(roomCode).emit('room:updated', room);
  }

  // ----------------------------------------------------------------
  // Periodic cleanup of stale rooms (older than 4 hours)
  // ----------------------------------------------------------------

  const ROOM_TTL_MS = 4 * 60 * 60 * 1000;

  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      if (now - room.createdAt > ROOM_TTL_MS) {
        io.to(code).emit('room:closed', { reason: 'Room expired' });
        clearTurnTimer(code);
        rooms.delete(code);
        console.log(`[socket] Stale room cleaned up: ${code}`);
      }
    }
  }, 60 * 1000);

  // ----------------------------------------------------------------
  // Start HTTP Server
  // ----------------------------------------------------------------

  httpServer.listen(port, () => {
    console.log(
      `> Cyberpunk TCG Simulator server ready on http://${hostname}:${port}`
    );
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });

  // ----------------------------------------------------------------
  // Graceful Shutdown
  // ----------------------------------------------------------------

  function gracefulShutdown(signal: string) {
    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);

    // Clear all turn timers
    for (const [code] of turnTimers) {
      clearTurnTimer(code);
    }

    // Notify all connected clients
    io.emit('server:shutdown', {
      message: 'Server is restarting. Please reconnect.',
    });

    // Close Socket.IO
    io.close(() => {
      console.log('[server] Socket.IO connections closed');
    });

    // Close HTTP server
    httpServer.close(() => {
      console.log('[server] HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
startServer().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
