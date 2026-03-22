'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { CardData } from '@/lib/data/types';

const COLOR_BORDERS: Record<string, string> = {
  red: '#ff003c',
  blue: '#00f0ff',
  green: '#22c55e',
  yellow: '#fcee09',
};

const TYPE_KEYS: Record<string, string> = {
  legend: 'game.typeLegend',
  unit: 'game.typeUnit',
  gear: 'game.typeGear',
  program: 'game.typeProgram',
};

interface CardFaceProps {
  card: CardData;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isSpent?: boolean;
  showGlow?: boolean;
  className?: string;
}

export default function CardFace({ card, size = 'md', onClick, isSpent, showGlow, className = '' }: CardFaceProps) {
  const t = useTranslations();
  const locale = useLocale();
  const borderColor = COLOR_BORDERS[card.color] || '#00f0ff';
  const imagePath = `/images/cards/${card.set}/${card.id}.webp`;
  const cardName = locale === 'fr' ? card.name_fr : card.name_en;
  const cardTitle = locale === 'fr' ? card.title_fr : card.title_en;

  const sizes = {
    sm: { w: 80, h: 112 },
    md: { w: 140, h: 196 },
    lg: { w: 200, h: 280 },
  };
  const { w, h } = sizes[size];

  return (
    <div
      className={`relative cursor-pointer transition-transform duration-200 ${isSpent ? 'rotate-90' : ''} ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        overflow: 'hidden',
        border: `2px solid ${borderColor}`,
        boxShadow: showGlow ? `0 0 12px ${borderColor}40` : 'none',
      }}
      onClick={onClick}
    >
      <Image
        src={imagePath}
        alt={`${cardName} ${cardTitle ? '- ' + cardTitle : ''}`}
        fill
        className="object-cover"
        sizes={`${w}px`}
      />
      {/* Cost badge */}
      {card.cost !== null && (
        <div
          className="absolute top-1 left-1 flex items-center justify-center font-blender font-bold"
          style={{
            width: size === 'sm' ? 18 : 24,
            height: size === 'sm' ? 18 : 24,
            background: '#0a0a12dd',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            color: borderColor,
            fontSize: size === 'sm' ? 10 : 13,
          }}
        >
          {String(card.cost).padStart(2, '0')}
        </div>
      )}
      {/* Power badge */}
      {card.power !== null && card.card_type !== 'program' && (
        <div
          className="absolute bottom-1 right-1 flex items-center justify-center font-blender font-bold"
          style={{
            width: size === 'sm' ? 18 : 24,
            height: size === 'sm' ? 18 : 24,
            background: '#0a0a12dd',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            color: '#e0e8f0',
            fontSize: size === 'sm' ? 10 : 13,
          }}
        >
          {card.card_type === 'gear' ? `+${card.power}` : String(card.power).padStart(2, '0')}
        </div>
      )}
      {/* Type badge */}
      <div
        className="absolute top-1 right-1 font-blender uppercase"
        style={{
          padding: '1px 4px',
          background: '#0a0a12cc',
          border: `1px solid ${borderColor}60`,
          borderRadius: 3,
          color: borderColor,
          fontSize: size === 'sm' ? 6 : 8,
          letterSpacing: 1,
        }}
      >
        {t(TYPE_KEYS[card.card_type] || 'game.typeUnit')}
      </div>
    </div>
  );
}
