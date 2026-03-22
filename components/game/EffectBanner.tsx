'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { EffectAnimationData } from '@/lib/engine/types';
import { useEffect, useState } from 'react';

const TRIGGER_COLORS: Record<string, string> = {
  PLAY: '#22c55e',
  ATTACK: '#ff003c',
  FLIP: '#a855f7',
  CALL: '#ffd700',
  PASSIVE: '#00f0ff',
  DEFEATED: '#ff003c',
  SPEND: '#fcee09',
};

interface EffectBannerProps {
  animation: EffectAnimationData | undefined;
  onComplete: () => void;
}

export default function EffectBanner({ animation, onComplete }: EffectBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (animation) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 400);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [animation, onComplete]);

  if (!animation) return null;

  const color = TRIGGER_COLORS[animation.triggerType] || '#00f0ff';
  const cardSet = animation.cardId.startsWith('b') ? 'spoiler' :
                  animation.cardId.startsWith('n') ? 'promo' : 'alpha';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px 10px 10px',
            maxWidth: 500,
            background: 'rgba(8,8,16,0.94)',
            border: `1px solid ${color}40`,
            borderRadius: 8,
            boxShadow: `0 0 20px ${color}20, 0 4px 16px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Card thumbnail */}
          <div style={{
            position: 'relative',
            width: 40,
            height: 56,
            borderRadius: 4,
            overflow: 'hidden',
            flexShrink: 0,
            border: `1px solid ${color}50`,
          }}>
            <Image
              src={`/images/cards/${cardSet}/${animation.cardId}.webp`}
              alt={animation.cardName}
              fill
              style={{ objectFit: 'cover' }}
              sizes="40px"
            />
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Trigger badge */}
              <span style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#0a0a12',
                background: color,
                padding: '1px 6px',
                borderRadius: 3,
              }}>
                {animation.triggerType}
              </span>
              {/* Card name */}
              <span style={{
                fontFamily: 'var(--font-refinery), sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#e0e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {animation.cardName}
              </span>
            </div>
            {/* Effect description */}
            {animation.description && (
              <span style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 11,
                color: '#7a8a9a',
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {animation.description}
              </span>
            )}
          </div>

          {/* Glow accent line */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            borderRadius: '0 0 8px 8px',
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
