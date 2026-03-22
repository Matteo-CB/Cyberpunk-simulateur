'use client';

import Image from 'next/image';
import type { EddyCard } from '@/lib/engine/types';

interface EddiesAreaProps {
  eddies: EddyCard[];
  label: string;
}

export default function EddiesArea({ eddies, label }: EddiesAreaProps) {
  const readyCount = eddies.filter((e) => !e.isSpent).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Large eddie count */}
      <div
        style={{
          fontFamily: 'var(--font-blender), sans-serif',
          fontSize: 18,
          fontWeight: 700,
          color: '#fcee09',
          lineHeight: 1,
          textShadow: '0 0 8px rgba(252, 238, 9, 0.3)',
        }}
      >
        E$ {readyCount}
      </div>

      {/* Small label */}
      <div
        style={{
          fontFamily: 'var(--font-blender), sans-serif',
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: '#5a5a6a',
          lineHeight: 1,
        }}
      >
        {label}
      </div>

      {/* Card-back thumbnails */}
      {eddies.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'center',
            maxWidth: 90,
          }}
        >
          {eddies.map((e) => (
            <div
              key={e.instanceId}
              style={{
                position: 'relative',
                width: 20,
                height: 28,
                borderRadius: 2,
                overflow: 'hidden',
                opacity: e.isSpent ? 0.3 : 1,
                border: e.isSpent
                  ? '1px solid #1e2030'
                  : '1px solid rgba(252, 238, 9, 0.4)',
                boxShadow: e.isSpent
                  ? 'none'
                  : '0 0 3px rgba(252, 238, 9, 0.15)',
                filter: e.isSpent ? 'grayscale(1)' : 'none',
                transition: 'opacity 0.3s ease, filter 0.3s ease',
              }}
            >
              <Image
                src="/images/card-back.webp"
                alt="Eddie"
                fill
                style={{ objectFit: 'cover' }}
                sizes="20px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
