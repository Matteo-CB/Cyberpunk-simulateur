'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface DeckPileProps {
  count: number;
  label?: string;
  compact?: boolean;
}

export default function DeckPile({ count, label, compact }: DeckPileProps) {
  const t = useTranslations();
  const displayLabel = label ?? t('game.deck').toUpperCase();
  // Show stacked card backs (max 4 visible layers)
  const layers = Math.min(count, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transform: compact ? 'scale(0.7)' : undefined, transformOrigin: 'center center' }}>
      <div style={{ position: 'relative', width: 52, height: 72 }}>
        {layers === 0 ? (
          <div style={{
            width: 52, height: 72, borderRadius: 4,
            border: '1px dashed rgba(252,238,9,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-blender" style={{ fontSize: 9, color: '#333' }}>{t('game.empty')}</span>
          </div>
        ) : (
          Array.from({ length: layers }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: i * 2,
                left: i * 1,
                width: 52,
                height: 72,
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(252,238,9,0.1)',
                boxShadow: i === layers - 1 ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                zIndex: i,
              }}
            >
              <Image src="/images/card-back.webp" alt="Card back" fill style={{ objectFit: 'cover' }} sizes="52px" />
            </div>
          ))
        )}
        {/* Count overlay */}
        {count > 0 && (
          <div style={{
            position: 'absolute', bottom: -2, right: -6, zIndex: 10,
            background: '#080810', border: '1px solid rgba(252,238,9,0.3)',
            borderRadius: 10, padding: '1px 6px',
          }}>
            <span className="font-blender" style={{ fontSize: 10, fontWeight: 700, color: '#e0e8f0' }}>{count}</span>
          </div>
        )}
      </div>
      <span className="font-blender" style={{ fontSize: 7, color: 'rgba(252,238,9,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{displayLabel}</span>
    </div>
  );
}
