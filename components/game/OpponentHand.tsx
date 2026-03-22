'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface OpponentHandProps {
  cardCount: number;
}

export default function OpponentHand({ cardCount }: OpponentHandProps) {
  const t = useTranslations();
  if (cardCount === 0) {
    return (
      <div className="font-blender" style={{ fontSize: 10, color: '#333', textAlign: 'center', padding: 8 }}>
        {t('game.noCards')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {Array.from({ length: cardCount }).map((_, i) => {
          const mid = (cardCount - 1) / 2;
          const offset = i - mid;
          const rotation = offset * 2.5;
          const translateY = Math.abs(offset) * 2;

          return (
            <div
              key={i}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                left: i === 0 ? 0 : `calc(50% + ${offset * 22}px - 20px)`,
                width: 40,
                height: 56,
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(252,238,9,0.08)',
                transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                zIndex: i,
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                flexShrink: 0,
              }}
            >
              <Image src="/images/card-back.webp" alt="Card" fill style={{ objectFit: 'cover' }} sizes="40px" />
            </div>
          );
        })}
      </div>
      <span className="font-blender" style={{ fontSize: 10, color: '#555', marginLeft: 12, flexShrink: 0 }}>{cardCount}</span>
    </div>
  );
}
