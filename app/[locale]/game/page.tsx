'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import GameBoard from '@/components/game/GameBoard';
import { GameEngine } from '@/lib/engine/GameEngine';
import { getAllCards, getCardById } from '@/lib/data/cardLoader';
import type { GameState } from '@/lib/engine/types';
import type { CardData } from '@/lib/data/types';

export default function GamePage() {
  const t = useTranslations();
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // Read config from sessionStorage
    const configStr = sessionStorage.getItem('gameConfig');
    const config = configStr ? JSON.parse(configStr) : { mode: 'ai', difficulty: 'easy' };

    const allCards = getAllCards();
    const legends = allCards.filter((c) => c.card_type === 'legend');
    const nonLegends = allCards.filter((c) => c.card_type !== 'legend');

    // Pick 3 random legends per player (unique names)
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

    // Pick 40 random non-legend cards (max 3 copies)
    const pickDeck = () => {
      const deck: typeof nonLegends = [];
      const counts = new Map<string, number>();
      const shuffled = [...nonLegends].sort(() => Math.random() - 0.5);
      for (const card of shuffled) {
        if (deck.length >= 40) break;
        const count = counts.get(card.id) || 0;
        if (count < 3) {
          deck.push(card);
          counts.set(card.id, count + 1);
        }
      }
      // Fill remaining with repeats if needed
      while (deck.length < 40) {
        const card = shuffled[Math.floor(Math.random() * shuffled.length)];
        const count = counts.get(card.id) || 0;
        if (count < 3) {
          deck.push(card);
          counts.set(card.id, count + 1);
        }
      }
      return deck;
    };

    // Load a saved deck by its card/legend IDs
    const loadSavedDeck = (deck: { cardIds: string[]; legendIds: string[] }): { cards: CardData[]; legends: CardData[] } | null => {
      const deckCards = deck.cardIds.map((id) => getCardById(id)).filter((c): c is CardData => !!c);
      const deckLegends = deck.legendIds.map((id) => getCardById(id)).filter((c): c is CardData => !!c);
      if (deckCards.length >= 40 && deckLegends.length === 3) {
        return { cards: deckCards, legends: deckLegends };
      }
      return null;
    };

    // Try to use a saved deck for player 1
    const initGame = async () => {
      let player1Cards = pickDeck();
      let player1Legends = pickLegends();

      try {
        const res = await fetch('/api/decks');
        if (res.ok) {
          const decks = await res.json();
          if (Array.isArray(decks) && decks.length > 0) {
            // Use the deck specified in config, or default to the first one
            const targetDeckId = config.deckId;
            const selectedDeck = targetDeckId
              ? decks.find((d: { id: string }) => d.id === targetDeckId) || decks[0]
              : decks[0];
            const loaded = loadSavedDeck(selectedDeck);
            if (loaded) {
              player1Cards = loaded.cards;
              player1Legends = loaded.legends;
            }
          }
        }
      } catch {
        // Fallback to random deck on any error
      }

      // AI opponent always uses random deck
      const state = GameEngine.createGame(
        player1Cards,
        player1Legends,
        pickDeck(),
        pickLegends(),
        {
          isAI: config.mode === 'ai',
          aiDifficulty: config.difficulty || 'easy',
        }
      );

      setGameState(state);
    };

    initGame();
  }, []);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0a12' }}>
        <div className="font-blender text-sm uppercase tracking-widest animate-pulse" style={{ color: '#00f0ff' }}>
          {t('game.initializing')}
        </div>
      </div>
    );
  }

  return <GameBoard initialState={gameState} myPlayer="player1" />;
}
