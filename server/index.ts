import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import next from 'next';
import { GameEngine } from '@/lib/engine/GameEngine';
import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || 'localhost';

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
// In-memory room store
// ------------------------------------------------------------------

const rooms = new Map<string, RoomData>();
const socketToRoom = new Map<string, string>();
const socketToUser = new Map<string, { userId: string; username: string }>();

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
        };

        rooms.set(roomCode, room);
        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);
        socketToUser.set(socket.id, { userId, username });

        io.to(roomCode).emit('room:updated', room);
        // Broadcast updated public room list to all clients
        broadcastRoomList();
        if (ack) ack({ ok: true });

        console.log(`[socket] Room created: ${roomCode} by ${username}`);
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
            const newState = GameEngine.applyAction(
              room.gameState as GameState,
              player as PlayerID,
              action as GameAction
            );
            room.gameState = newState;

            // Broadcast updated state to ALL clients in the room
            io.to(roomCode).emit('game:state-update', {
              gameState: newState,
              timestamp: Date.now(),
            });

            // Notify the player whose turn it is
            const activePlayer = newState.activePlayer;
            // Find all sockets in the room and emit game:your-turn to the active player
            const socketsInRoom = io.sockets.adapter.rooms.get(roomCode);
            if (socketsInRoom) {
              for (const socketId of socketsInRoom) {
                const userData = socketToUser.get(socketId);
                if (userData) {
                  // Determine which player this socket is
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
          for (const [, u] of socketToUser.entries()) {
            if (u.userId === user.userId) {
              const sr = socketToRoom.get(Array.from(socketToUser.entries()).find(([, v]) => v.userId === u.userId)?.[0] || '');
              if (sr === roomCode) { hostReconnected = true; break; }
            }
          }
          if (!hostReconnected) {
            io.to(roomCode).emit('room:closed', { reason: 'Host left the room' });
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
