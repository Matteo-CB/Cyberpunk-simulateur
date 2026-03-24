'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import GameBoard from '@/components/game/GameBoard';
import DeckSelector from '@/components/game/DeckSelector';
import { GameEngine } from '@/lib/engine/GameEngine';
import { getAllCards } from '@/lib/data/cardLoader';
import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import type { CardData } from '@/lib/data/types';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export default function GamePage() {
  const t = useTranslations();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [serverState, setServerState] = useState<{ state: GameState; seq: number } | null>(null);
  const seqRef = useRef(0);
  const [myPlayer, setMyPlayer] = useState<PlayerID>('player1');
  const [isOnline, setIsOnline] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  // Status flow: loading → connecting → waiting → deck-select → waiting-opponent-deck → playing
  const [status, setStatus] = useState<string>('loading');
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const gameCreatedRef = useRef(false);
  const configRef = useRef<any>(null);

  // Deck selection
  const myDeckRef = useRef<{ cards: CardData[]; legends: CardData[] } | null>(null);
  const [opponentDeckReady, setOpponentDeckReady] = useState(false);

  // Timer & game end
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [gameEndData, setGameEndData] = useState<{ eloChange: number | null; isRanked: boolean } | null>(null);

  // Random deck/legends generators
  const pickRandomDeck = useCallback(() => {
    const allCards = getAllCards();
    const nonLegends = allCards.filter((c) => c.card_type !== 'legend');
    const deck: CardData[] = [];
    const counts = new Map<string, number>();
    const shuffled = [...nonLegends].sort(() => Math.random() - 0.5);
    for (const card of shuffled) {
      if (deck.length >= 40) break;
      const count = counts.get(card.id) || 0;
      if (count < 3) { deck.push(card); counts.set(card.id, count + 1); }
    }
    while (deck.length < 40) {
      const card = shuffled[Math.floor(Math.random() * shuffled.length)];
      const count = counts.get(card.id) || 0;
      if (count < 3) { deck.push(card); counts.set(card.id, count + 1); }
    }
    return deck;
  }, []);

  const pickRandomLegends = useCallback(() => {
    const allCards = getAllCards();
    const legends = allCards.filter((c) => c.card_type === 'legend');
    const shuffled = [...legends].sort(() => Math.random() - 0.5);
    const picked: CardData[] = [];
    const usedNames = new Set<string>();
    for (const l of shuffled) {
      if (!usedNames.has(l.name_en) && picked.length < 3) { picked.push(l); usedNames.add(l.name_en); }
    }
    return picked;
  }, []);

  useEffect(() => {
    const configStr = sessionStorage.getItem('gameConfig');
    const config = configStr ? JSON.parse(configStr) : { mode: 'ai', difficulty: 'easy' };
    configRef.current = config;

    // AI mode: deck selector immediately
    if (config.mode !== 'online') {
      setStatus('deck-select');
      return;
    }

    // ════════ ONLINE MODE ════════
    setIsOnline(true);
    setIsRanked(config.gameMode === 'ranked');
    roomCodeRef.current = config.roomCode;
    const isHost = config.isHost;
    setMyPlayer(isHost ? 'player1' : 'player2');
    setStatus('connecting');

    const s = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    socketRef.current = s;

    let userId = config.userId || 'anon';
    let username = config.username || 'Player';
    fetch('/api/user/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { userId = d.id; username = d.username; }
    }).catch(() => {});

    s.on('connect', () => {
      console.log('[game] Socket connected');
      s.emit('auth', { userId, username });

      if (isHost) {
        s.emit('room:create', {
          roomCode: config.roomCode, userId, username,
          isPrivate: config.isPrivate || false,
          isRanked: config.gameMode === 'ranked',
          gameMode: config.gameMode || 'casual',
        }, (res: any) => {
          if (!res?.ok) {
            s.emit('room:join', { roomCode: config.roomCode, userId, username }, (joinRes: any) => {
              if (!joinRes?.ok) { setStatus('error'); return; }
              setStatus('waiting');
            });
            return;
          }
          setStatus('waiting'); // Wait for opponent to join
        });
      } else {
        s.emit('room:join', { roomCode: config.roomCode, userId, username }, (res: any) => {
          if (!res?.ok) { setStatus('error'); return; }
          if (res.room?.gameMode === 'ranked' || res.room?.isRanked) {
            setIsRanked(true);
          }
          setStatus('waiting');
        });
      }
    });

    // Opponent joined → both players go to deck select
    s.on('room:player-joined', () => {
      console.log('[game] Opponent joined, showing deck selector');
      setStatus('deck-select');
    });

    // For guest: if host already in room, also go to deck select
    s.on('room:updated', (room: any) => {
      if (!isHost && room?.hostId && room?.guestId) {
        // Both players in room
        setStatus((prev) => prev === 'waiting' ? 'deck-select' : prev);
      }
    });

    // Deck status updates from server
    s.on('game:deck-status', (data: { player1Ready: boolean; player2Ready: boolean }) => {
      const oppReady = isHost ? data.player2Ready : data.player1Ready;
      setOpponentDeckReady(oppReady);
    });

    // Both players selected their deck → host creates the game
    s.on('game:both-ready', () => {
      console.log('[game] Both decks ready');
      if (isHost && myDeckRef.current && !gameCreatedRef.current) {
        gameCreatedRef.current = true;
        const state = GameEngine.createGame(
          myDeckRef.current.cards, myDeckRef.current.legends,
          pickRandomDeck(), pickRandomLegends(),
          { player1UserId: userId }
        );
        setGameState(state);
        setStatus('playing');
        s.emit('game:state-update', { roomCode: config.roomCode, gameState: state });
      }
    });

    s.on('game:state-update', (payload: any) => {
      const state: GameState = payload?.gameState || payload;
      if (state) {
        state.effectAnimationQueue = state.effectAnimationQueue || [];
        state.endOfTurnEffects = state.endOfTurnEffects || [];
        state.pendingActions = state.pendingActions || [];
        state.pendingEffects = state.pendingEffects || [];
        state.log = state.log || [];
        state.passiveTrackers = state.passiveTrackers || {
          a001_firstArasakaAttack: { player1: false, player2: false },
          a002_firstBlueCard: { player1: false, player2: false },
          b111_firstSteal: { player1: false, player2: false },
          b125_goroSpendUsed: { player1: false, player2: false },
          b121_removedFromGame: { player1: false, player2: false },
        };
        for (const p of [state.player1, state.player2]) {
          if (p) {
            p.hand = p.hand || []; p.deck = p.deck || []; p.field = p.field || [];
            p.trash = p.trash || []; p.legends = p.legends || []; p.eddies = p.eddies || [];
            p.fixerArea = p.fixerArea || []; p.gigArea = p.gigArea || [];
          }
        }
      }
      if (!gameState) setGameState(state);
      seqRef.current += 1;
      setServerState({ state, seq: seqRef.current });
      setStatus('playing');
    });

    s.on('game:timer-start', (data: { activePlayer: string; duration: number; startedAt: number }) => {
      setTimerEnd(data.startedAt + data.duration);
    });
    s.on('game:timer-expired', () => setTimerEnd(null));
    s.on('game:ended', (data: any) => {
      const myEloChange = isHost ? data.player1EloChange : data.player2EloChange;
      setGameEndData({ eloChange: myEloChange ?? null, isRanked: data.isRanked });
      setTimerEnd(null);
    });

    s.on('room:player-left', () => setStatus('opponent-left'));
    s.on('room:closed', () => setStatus('closed'));
    s.on('connect_error', (err) => console.error('[game] Socket error:', err.message));

    return () => { s.disconnect(); };
  }, []);

  // Deck selected by this player
  const handleDeckSelected = useCallback((cards: CardData[], legends: CardData[]) => {
    myDeckRef.current = { cards, legends };
    const config = configRef.current;
    if (!config) return;

    if (config.mode !== 'online') {
      // AI: start game immediately
      setGameState(GameEngine.createGame(cards, legends, pickRandomDeck(), pickRandomLegends(), {
        isAI: true, aiDifficulty: config.difficulty || 'easy',
      }));
      setStatus('playing');
      return;
    }

    // Online: notify server we're ready
    const s = socketRef.current;
    if (!s) return;
    s.emit('game:deck-ready', { roomCode: config.roomCode, player: config.isHost ? 'player1' : 'player2' });
    setStatus('waiting-opponent-deck');
  }, [pickRandomDeck, pickRandomLegends]);

  const handleOnlineAction = useCallback((action: GameAction) => {
    if (!socketRef.current || !roomCodeRef.current) return;
    socketRef.current.emit('game:action', { roomCode: roomCodeRef.current, action, player: myPlayer });
  }, [myPlayer]);

  // ═══ RENDER ═══

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      <div className="font-refinery" style={{ color: '#ff003c', fontSize: 24 }}>Room not found</div>
      <button className="font-blender" onClick={() => window.location.href = '/'}
        style={{ color: '#00f0ff', background: 'transparent', border: '1px solid #00f0ff30', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Back</button>
    </div>
  );

  if (status === 'closed' || status === 'opponent-left') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      <div className="font-refinery" style={{ color: '#fcee09', fontSize: 24 }}>{status === 'closed' ? 'Room Closed' : 'Opponent Left'}</div>
      <button className="font-blender" onClick={() => window.location.href = '/'}
        style={{ color: '#00f0ff', background: 'transparent', border: '1px solid #00f0ff30', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Back</button>
    </div>
  );

  // Waiting for opponent to join
  if (status === 'waiting' || status === 'connecting') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      {roomCodeRef.current && (
        <div className="font-refinery" style={{ color: '#fcee09', fontSize: 36, letterSpacing: '0.3em', textShadow: '0 0 20px rgba(252,238,9,0.3)' }}>
          {roomCodeRef.current}
        </div>
      )}
      <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#5a6a7a' }}>
        {status === 'connecting' ? 'Connecting...' : t('game.waitingOpponent')}
      </div>
    </div>
  );

  // Deck selection (both AI and online)
  if (status === 'deck-select') return (
    <div className="min-h-screen" style={{ background: '#0a0a12' }}>
      {isOnline && roomCodeRef.current && (
        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
          <div className="font-refinery" style={{ color: '#fcee09', fontSize: 24, letterSpacing: '0.3em', textShadow: '0 0 20px rgba(252,238,9,0.3)' }}>
            {roomCodeRef.current}
          </div>
          <div className="font-blender" style={{ color: '#5a6a7a', fontSize: 11, textTransform: 'uppercase', marginTop: 4 }}>
            {isRanked ? t('game.rankedMatch') : t('game.casualMatch')}
          </div>
        </div>
      )}
      <DeckSelector onSelect={handleDeckSelected} />
    </div>
  );

  // Waiting for opponent to pick deck
  if (status === 'waiting-opponent-deck') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      {roomCodeRef.current && (
        <div className="font-refinery" style={{ color: '#fcee09', fontSize: 28, letterSpacing: '0.3em', textShadow: '0 0 20px rgba(252,238,9,0.3)' }}>
          {roomCodeRef.current}
        </div>
      )}
      <div className="font-blender" style={{ color: '#22c55e', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {t('game.deckSelected')}
      </div>
      <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#5a6a7a', marginTop: 8 }}>
        {t('game.waitingOpponentDeck')}
      </div>
    </div>
  );

  if (!gameState) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a12' }}>
      <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#00f0ff' }}>
        {t('game.initializing')}
      </div>
    </div>
  );

  return <GameBoard
    initialState={gameState}
    myPlayer={myPlayer}
    isOnline={isOnline}
    isRanked={isRanked}
    onAction={isOnline ? handleOnlineAction : undefined}
    serverState={isOnline ? serverState : undefined}
    turnTimerEnd={isOnline ? timerEnd : undefined}
    eloChange={gameEndData?.eloChange}
  />;
}
