'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const configStr = sessionStorage.getItem('gameConfig');
    const config = configStr ? JSON.parse(configStr) : { mode: 'ai', difficulty: 'easy' };

    const allCards = getAllCards();
    const legends = allCards.filter((c) => c.card_type === 'legend');
    const nonLegends = allCards.filter((c) => c.card_type !== 'legend');

    const pickLegends = () => {
      const shuffled = [...legends].sort(() => Math.random() - 0.5);
      const picked: typeof legends = [];
      const usedNames = new Set<string>();
      for (const l of shuffled) {
        if (!usedNames.has(l.name_en) && picked.length < 3) {
          picked.push(l);
          usedNames.add(l.name_en);
        }
      }
      return picked;
    };

    const pickDeck = () => {
      const deck: typeof nonLegends = [];
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

    const loadSavedDeck = (deck: { cardIds: string[]; legendIds: string[] }): { cards: CardData[]; legends: CardData[] } | null => {
      const deckCards = deck.cardIds.map((id) => getCardById(id)).filter((c): c is CardData => !!c);
      const deckLegends = deck.legendIds.map((id) => getCardById(id)).filter((c): c is CardData => !!c);
      if (deckCards.length >= 40 && deckLegends.length === 3) return { cards: deckCards, legends: deckLegends };
      return null;
    };

    // ════════ ONLINE MODE ════════
    if (config.mode === 'online' && config.roomCode) {
      setIsOnline(true);
      setRoomCode(config.roomCode);

      const initOnline = async () => {
        let player1Cards = pickDeck();
        let player1Legends = pickLegends();
        try {
          const res = await fetch('/api/decks');
          if (res.ok) {
            const decks = await res.json();
            if (Array.isArray(decks) && decks.length > 0) {
              const loaded = loadSavedDeck(decks[0]);
              if (loaded) { player1Cards = loaded.cards; player1Legends = loaded.legends; }
            }
          }
        } catch {}

        // Get user info
        let userId = 'anonymous';
        let username = 'Player';
        try {
          const meRes = await fetch('/api/user/me');
          if (meRes.ok) {
            const me = await meRes.json();
            userId = me.id;
            username = me.username;
          }
        } catch {}

        const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = s;

        s.on('connect', () => {
          s.emit('auth', { userId, username });
          if (config.isHost) {
            // Host already created room in online page, just join the socket room
            s.emit('room:join', { roomCode: config.roomCode, userId, username });
            setMyPlayer('player1');
            setWaitingForOpponent(true);
          } else {
            s.emit('room:join', { roomCode: config.roomCode, userId, username });
            setMyPlayer('player2');
          }
        });

        s.on('room:player-joined', (data: { userId: string; username: string }) => {
          setWaitingForOpponent(false);
          // If I'm host, create the game and send state
          if (config.isHost) {
            const state = GameEngine.createGame(
              player1Cards, player1Legends,
              pickDeck(), pickLegends(),
              { player1UserId: userId, player2UserId: data.userId }
            );
            setGameState(state);
            s.emit('game:state-update', { roomCode: config.roomCode, gameState: state });
          }
        });

        s.on('game:state-update', (state: GameState) => {
          setGameState(state);
        });

        s.on('game:action-received', (data: { action: GameAction; player: PlayerID }) => {
          setGameState((prev) => {
            if (!prev) return prev;
            return GameEngine.applyAction(prev, data.player, data.action);
          });
        });

        s.on('room:player-left', () => {
          setWaitingForOpponent(true);
        });

        s.on('room:closed', () => {
          setWaitingForOpponent(false);
          setGameState(null);
          alert('Room closed by host');
          window.location.href = '/play/online';
        });
      };

      initOnline();
      return () => { socketRef.current?.disconnect(); };
    }

    // ════════ AI MODE ════════
    const initAI = async () => {
      let player1Cards = pickDeck();
      let player1Legends = pickLegends();
      try {
        const res = await fetch('/api/decks');
        if (res.ok) {
          const decks = await res.json();
          if (Array.isArray(decks) && decks.length > 0) {
            const targetDeckId = config.deckId;
            const selectedDeck = targetDeckId
              ? decks.find((d: { id: string }) => d.id === targetDeckId) || decks[0]
              : decks[0];
            const loaded = loadSavedDeck(selectedDeck);
            if (loaded) { player1Cards = loaded.cards; player1Legends = loaded.legends; }
          }
        }
      } catch {}

      const state = GameEngine.createGame(
        player1Cards, player1Legends,
        pickDeck(), pickLegends(),
        { isAI: true, aiDifficulty: config.difficulty || 'easy' }
      );
      setGameState(state);
    };

    initAI();
  }, []);

  const handleOnlineAction = (action: GameAction) => {
    if (!socketRef.current || !roomCode) return;
    // Apply locally
    setGameState((prev) => {
      if (!prev) return prev;
      const ns = GameEngine.applyAction(prev, myPlayer, action);
      // Send to server
      socketRef.current?.emit('game:action', { roomCode, action, player: myPlayer });
      socketRef.current?.emit('game:state-update', { roomCode, gameState: ns });
      return ns;
    });
  };

  if (waitingForOpponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#0a0a12', gap: 16 }}>
        <div className="font-refinery" style={{ color: '#00f0ff', fontSize: 24, letterSpacing: '0.15em', textShadow: '0 0 20px rgba(0,240,255,0.3)' }}>
          {roomCode}
        </div>
        <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#5a6a7a' }}>
          Waiting for opponent...
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a12' }}>
        <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#00f0ff' }}>
          {t('game.initializing')}
        </div>
      </div>
    );
  }

  return (
    <GameBoard
      initialState={gameState}
      myPlayer={myPlayer}
      isOnline={isOnline}
      onAction={isOnline ? handleOnlineAction : undefined}
    />
  );
}
