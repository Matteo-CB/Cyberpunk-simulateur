'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import type { CardData } from '@/lib/data/types';

const COLOR_MAP: Record<string, string> = {
  red: '#ff003c', blue: '#00f0ff', green: '#22c55e', yellow: '#fcee09',
};

interface CardInHandProps {
  card: CardData;
  index: number;
  totalCards: number;
  isSelected?: boolean;
  isPlayable?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export default function CardInHand({
  card, index, totalCards, isSelected, isPlayable, compact, onClick, onHover, onHoverEnd,
}: CardInHandProps) {
  const locale = useLocale();
  const cardName = locale === 'fr' ? card.name_fr : card.name_en;
  const midpoint = (totalCards - 1) / 2;
  const offset = index - midpoint;
  const rotation = offset * (compact ? 2 : 2.5);
  const translateY = Math.abs(offset) * (compact ? 3 : 5);
  const maxSpread = compact ? 200 : 280;
  const spacing = Math.min(compact ? 32 : 45, maxSpread / Math.max(totalCards, 1));
  const translateX = offset * spacing;
  const color = COLOR_MAP[card.color] || '#00f0ff';

  const w = compact ? 50 : 76;
  const h = compact ? 70 : 106;
  const halfW = w / 2;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 0,
        zIndex: isSelected ? 50 : 10 + index,
        cursor: 'pointer',
      }}
      animate={{
        x: translateX - halfW,
        y: isSelected ? -(compact ? 25 : 40) - translateY : -translateY,
        rotate: isSelected ? 0 : rotation,
      }}
      whileHover={compact ? undefined : { y: -35 - translateY, scale: 1.06, zIndex: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      onHoverStart={onHover}
      onHoverEnd={onHoverEnd}
    >
      <div style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: compact ? 4 : 5,
        overflow: 'hidden',
        border: isSelected ? `2px solid ${color}` : '1px solid rgba(252,238,9,0.12)',
        boxShadow: isSelected
          ? `0 0 14px ${color}50, 0 4px 12px rgba(0,0,0,0.6)`
          : '0 2px 8px rgba(0,0,0,0.5)',
        opacity: isPlayable === false ? 0.4 : 1,
        filter: isPlayable === false ? 'grayscale(0.4)' : 'none',
        transition: 'opacity 0.2s, filter 0.2s',
      }}>
        <Image
          src={`/images/cards/${card.set}/${card.id}.webp`}
          alt={cardName}
          fill
          style={{ objectFit: 'cover' }}
          sizes={`${w}px`}
        />
        {/* Cost badge */}
        {card.cost !== null && (
          <div style={{
            position: 'absolute', top: 2, left: 2,
            width: compact ? 13 : 16, height: compact ? 13 : 16, borderRadius: 3,
            background: 'rgba(0,0,0,0.8)', border: `1px solid ${color}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-blender), sans-serif',
            fontSize: compact ? 7 : 9, fontWeight: 700, color: '#fcee09',
          }}>
            {card.cost}
          </div>
        )}
        {/* Power badge */}
        {card.power !== null && card.card_type !== 'program' && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: compact ? 13 : 16, height: compact ? 13 : 16, borderRadius: 3,
            background: 'rgba(0,0,0,0.8)', border: `1px solid ${color}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-blender), sans-serif',
            fontSize: compact ? 7 : 9, fontWeight: 700, color: '#ff003c',
          }}>
            {card.power}
          </div>
        )}
      </div>
    </motion.div>
  );
}
