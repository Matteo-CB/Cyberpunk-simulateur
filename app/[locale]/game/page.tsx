'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import GameBoard from '@/components/game/GameBoard';
import { GameEngine } from '@/lib/engine/GameEngine';
import { getAllCards, getCardById } from '@/lib/data/cardLoader';
import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import type { CardData } from '@/lib/data/types';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export default function GamePage() {
  const t = useTranslations();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<PlayerID>('player1');
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState<string>('loading');
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const gameCreatedRef = useRef(false);

  useEffect(() => {
    const configStr = sessionStorage.getItem('gameConfig');
    const config = configStr ? JSON.parse(configStr) : { mode: 'ai', difficulty: 'easy' };

    const allCards = getAllCards();
    const legends = allCards.filter((c) => c.card_type === 'legend');
    const nonLegends = allCards.filter((c) => c.card_type !== 'legend');

    const pickLegends = () => {
      const shuffled = [...legends].sort(() => Math.random() - 0.5);
      const picked: CardData[] = [];
      const usedNames = new Set<string>();
      for (const l of shuffled) {
        if (!usedNames.has(l.name_en) && picked.length < 3) { picked.push(l); usedNames.add(l.name_en); }
      }
      return picked;
    };

    const pickDeck = () => {
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
    };

    // ════════ AI MODE ════════
    if (config.mode !== 'online') {
      const initAI = async () => {
        let p1Cards = pickDeck();
        let p1Legends = pickLegends();
        try {
          const res = await fetch('/api/decks');
          if (res.ok) {
            const decks = await res.json();
            if (Array.isArray(decks) && decks.length > 0) {
              const deck = config.deckId ? decks.find((d: any) => d.id === config.deckId) || decks[0] : decks[0];
              const cards = deck.cardIds.map((id: string) => getCardById(id)).filter(Boolean);
              const legs = deck.legendIds.map((id: string) => getCardById(id)).filter(Boolean);
              if (cards.length >= 40 && legs.length === 3) { p1Cards = cards; p1Legends = legs; }
            }
          }
        } catch {}
        setGameState(GameEngine.createGame(p1Cards, p1Legends, pickDeck(), pickLegends(), {
          isAI: true, aiDifficulty: config.difficulty || 'easy',
        }));
        setStatus('playing');
      };
      initAI();
      return;
    }

    // ════════ ONLINE MODE ════════
    setIsOnline(true);
    roomCodeRef.current = config.roomCode;
    const isHost = config.isHost;
    setMyPlayer(isHost ? 'player1' : 'player2');
    setStatus('connecting');

    const myDeck = pickDeck();
    const myLegends = pickLegends();

    function createAndSendGame(s: Socket, userId: string) {
      if (gameCreatedRef.current) return;
      gameCreatedRef.current = true;
      const state = GameEngine.createGame(
        myDeck, myLegends, pickDeck(), pickLegends(),
        { player1UserId: userId }
      );
      setGameState(state);
      setStatus('playing');
      s.emit('game:state-update', { roomCode: config.roomCode, gameState: state });
    }

    // Connect socket immediately — use polling first (more reliable behind proxy)
    const s = io(SOCKET_URL, { transports: ['polling', 'websocket'] });
    socketRef.current = s;

    // Fetch user in background (don't block socket connection)
    let userId = config.userId || 'anon';
    let username = config.username || 'Player';
    fetch('/api/user/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { userId = d.id; username = d.username; }
    }).catch(() => {});

    s.on('connect', () => {
      console.log('[game] Socket connected, joining room', config.roomCode);
      s.emit('auth', { userId, username });
      s.emit('room:join', { roomCode: config.roomCode, userId, username }, (res: any) => {
        console.log('[game] Room join result:', res?.ok, 'guestId:', res?.room?.guestId);
        if (!res?.ok) { setStatus('error'); return; }

        if (isHost) {
          if (res.room?.guestId && res.room.guestId !== userId) {
            createAndSendGame(s, userId);
          } else {
            setStatus('waiting');
          }
        } else {
          setStatus('waiting');
        }
      });
    });

    s.on('room:player-joined', () => {
      console.log('[game] Player joined event received, isHost:', isHost);
      if (isHost) {
        createAndSendGame(s, userId);
      }
    });

    s.on('game:state-update', (state: GameState) => {
      console.log('[game] Received game state');
      setGameState(state);
      setStatus('playing');
    });

    s.on('game:action-received', (data: { action: GameAction; player: PlayerID }) => {
      setGameState(prev => {
        if (!prev) return prev;
        try { return GameEngine.applyAction(prev, data.player, data.action); } catch { return prev; }
      });
    });

    s.on('room:player-left', () => setStatus('opponent-left'));
    s.on('room:closed', () => setStatus('closed'));
    s.on('connect_error', (err) => console.error('[game] Socket error:', err.message));

    return () => { s.disconnect(); };
  }, []);

  const handleOnlineAction = useCallback((action: GameAction) => {
    if (!socketRef.current || !roomCodeRef.current) return;
    setGameState(prev => {
      if (!prev) return prev;
      try {
        const ns = GameEngine.applyAction(prev, myPlayer, action);
        socketRef.current?.emit('game:action', { roomCode: roomCodeRef.current, action, player: myPlayer });
        return ns;
      } catch { return prev; }
    });
  }, [myPlayer]);

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      <div className="font-refinery" style={{ color: '#ff003c', fontSize: 24 }}>Room not found</div>
      <button className="font-blender" onClick={() => window.location.href = '/play/online'}
        style={{ color: '#00f0ff', background: 'transparent', border: '1px solid #00f0ff30', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Back</button>
    </div>
  );

  if (status === 'closed' || status === 'opponent-left') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      <div className="font-refinery" style={{ color: '#fcee09', fontSize: 24 }}>{status === 'closed' ? 'Room Closed' : 'Opponent Left'}</div>
      <button className="font-blender" onClick={() => window.location.href = '/play/online'}
        style={{ color: '#00f0ff', background: 'transparent', border: '1px solid #00f0ff30', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Back</button>
    </div>
  );

  if (status === 'waiting' || status === 'connecting') return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
      {roomCodeRef.current && (
        <div className="font-refinery" style={{ color: '#fcee09', fontSize: 36, letterSpacing: '0.3em', textShadow: '0 0 20px rgba(252,238,9,0.3)' }}>
          {roomCodeRef.current}
        </div>
      )}
      <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#5a6a7a' }}>
        {status === 'connecting' ? 'Connecting...' : 'Waiting for opponent...'}
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

  return <GameBoard initialState={gameState} myPlayer={myPlayer} isOnline={isOnline} onAction={isOnline ? handleOnlineAction : undefined} />;
}
