'use client';

import { useRef, useCallback } from 'react';
import CardInHand from '@/components/cards/CardInHand';
import type { CardData } from '@/lib/data/types';

interface PlayerHandProps {
  cards: CardData[];
  selectedIndex: number | null;
  playableIndices: number[];
  compact?: boolean;
  onSelectCard: (index: number) => void;
  onHoverCard: (card: CardData | null) => void;
  onLongPress?: (card: CardData) => void;
}

export default function PlayerHand({
  cards, selectedIndex, playableIndices, compact, onSelectCard, onHoverCard, onLongPress,
}: PlayerHandProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const handleTouchStart = useCallback((card: CardData) => {
    if (!onLongPress) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress(card);
    }, 400);
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: compact ? 70 : 120 }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {cards.map((card, i) => (
          <div
            key={`${card.id}-${i}`}
            onTouchStart={() => handleTouchStart(card)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
          >
            <CardInHand
              card={card}
              index={i}
              totalCards={cards.length}
              isSelected={selectedIndex === i}
              isPlayable={playableIndices.includes(i)}
              compact={compact}
              onClick={() => {
                if (longPressTriggered.current) return; // Don't trigger click after long press
                onSelectCard(i);
              }}
              onHover={() => onHoverCard(card)}
              onHoverEnd={() => onHoverCard(null)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
