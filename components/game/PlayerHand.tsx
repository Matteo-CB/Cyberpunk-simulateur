'use client';

import CardInHand from '@/components/cards/CardInHand';
import type { CardData } from '@/lib/data/types';

interface PlayerHandProps {
  cards: CardData[];
  selectedIndex: number | null;
  playableIndices: number[];
  onSelectCard: (index: number) => void;
  onHoverCard: (card: CardData | null) => void;
}

export default function PlayerHand({
  cards, selectedIndex, playableIndices, onSelectCard, onHoverCard,
}: PlayerHandProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 120 }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {cards.map((card, i) => (
          <CardInHand
            key={`${card.id}-${i}`}
            card={card}
            index={i}
            totalCards={cards.length}
            isSelected={selectedIndex === i}
            isPlayable={playableIndices.includes(i)}
            onClick={() => onSelectCard(i)}
            onHover={() => onHoverCard(card)}
            onHoverEnd={() => onHoverCard(null)}
          />
        ))}
      </div>
    </div>
  );
}
