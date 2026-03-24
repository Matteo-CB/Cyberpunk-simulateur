'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { getAllCards, getCardById } from '@/lib/data/cardLoader';
import type { CardData } from '@/lib/data/types';

interface SavedDeck {
  id: string;
  name: string;
  cardIds: string[];
  legendIds: string[];
}

interface DeckSelectorProps {
  onSelect: (cards: CardData[], legends: CardData[]) => void;
}

export default function DeckSelector({ onSelect }: DeckSelectorProps) {
  const t = useTranslations();
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/decks')
      .then((res) => res.ok ? res.json() : [])
      .then((data: SavedDeck[]) => { setSavedDecks(data); setLoading(false); })
      .catch(() => { setSavedDecks([]); setLoading(false); });
  }, []);

  const handleSelect = (deckId: string | null) => {
    setSelectedId(deckId);

    if (!deckId) {
      // Random deck
      const allCards = getAllCards();
      const legends = allCards.filter((c) => c.card_type === 'legend');
      const nonLegends = allCards.filter((c) => c.card_type !== 'legend');

      const shuffledLegends = [...legends].sort(() => Math.random() - 0.5);
      const pickedLegends: CardData[] = [];
      const usedNames = new Set<string>();
      for (const l of shuffledLegends) {
        if (!usedNames.has(l.name_en) && pickedLegends.length < 3) {
          pickedLegends.push(l);
          usedNames.add(l.name_en);
        }
      }

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

      onSelect(deck, pickedLegends);
      return;
    }

    // Saved deck
    const saved = savedDecks.find((d) => d.id === deckId);
    if (!saved) return;

    const cards = saved.cardIds.map((id) => getCardById(id)).filter(Boolean) as CardData[];
    const legs = saved.legendIds.map((id) => getCardById(id)).filter(Boolean) as CardData[];

    if (cards.length < 40 || legs.length !== 3) {
      // Deck is invalid, fall back to random
      handleSelect(null);
      return;
    }

    onSelect(cards, legs);
  };

  const selectedStyle = {
    background: 'rgba(0,240,255,0.06)',
    border: '1px solid rgba(0,240,255,0.4)',
  };
  const unselectedStyle = {
    background: '#0d0d1a',
    border: '1px solid #1e2030',
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(2,2,8,0.92)', padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          padding: '36px 32px', borderRadius: 16,
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
          border: '1px solid rgba(0,240,255,0.2)',
          maxWidth: 500, width: '100%',
          boxShadow: '0 0 60px rgba(0,240,255,0.08), 0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <h2 className="font-refinery" style={{
          fontSize: 24, letterSpacing: '0.15em', color: '#00f0ff',
          textShadow: '0 0 20px rgba(0,240,255,0.3)',
        }}>
          {t('game.selectDeck')}
        </h2>
        <p className="font-blender" style={{ color: '#5a6a7a', fontSize: 12, textAlign: 'center' }}>
          {t('game.selectDeckDesc')}
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {/* Random deck option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="font-blender cursor-pointer"
            onClick={() => handleSelect(null)}
            style={{
              ...(selectedId === null && selectedId !== undefined ? selectedStyle : unselectedStyle),
              padding: '14px 18px', borderRadius: 10, textAlign: 'left',
              width: '100%', display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: '#00f0ff' }}>{t('game.randomDeck')}</span>
            <span style={{ fontSize: 11, color: '#4a5a6a' }}>{t('game.randomDeckDesc')}</span>
          </motion.button>

          {/* Loading */}
          {loading && (
            <div className="font-blender" style={{ color: '#3a4a5a', fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
              {t('game.loadingDecks')}
            </div>
          )}

          {/* Saved decks */}
          {!loading && savedDecks.map((deck) => (
            <motion.button
              key={deck.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="font-blender cursor-pointer"
              onClick={() => handleSelect(deck.id)}
              style={{
                ...(selectedId === deck.id ? selectedStyle : unselectedStyle),
                padding: '14px 18px', borderRadius: 10, textAlign: 'left',
                width: '100%', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e0e8f0' }}>{deck.name}</span>
              <span style={{ fontSize: 11, color: '#4a5a6a' }}>
                {deck.cardIds.length} {t('game.cards')} + {deck.legendIds.length} Legends
              </span>
            </motion.button>
          ))}

          {!loading && savedDecks.length === 0 && (
            <div className="font-blender" style={{ color: '#3a4a5a', fontSize: 11, padding: '8px 0', textAlign: 'center', fontStyle: 'italic' }}>
              {t('game.noSavedDecks')}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
