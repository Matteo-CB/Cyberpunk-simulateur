'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { GigDie, DieType } from '@/lib/engine/types';

const DIE_COLORS: Record<DieType, string> = {
  d4: '#ff003c', d6: '#fcee09', d8: '#22c55e',
  d10: '#00f0ff', d12: '#a855f7', d20: '#ffd700',
};

const DIE_CLIPS: Record<DieType, string> = {
  d4: 'polygon(50% 5%, 8% 92%, 92% 92%)',
  d6: 'none',
  d8: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)',
  d10: 'polygon(50% 2%, 96% 38%, 80% 96%, 20% 96%, 4% 38%)',
  d12: 'polygon(50% 2%, 98% 34%, 86% 94%, 14% 94%, 2% 34%)',
  d20: 'polygon(50% 2%, 98% 26%, 98% 74%, 50% 98%, 2% 74%, 2% 26%)',
};

interface FixerAreaProps {
  dice: GigDie[];
  canChoose: boolean;
  onChoose: (index: number) => void;
  compact?: boolean;
}

export default function FixerArea({ dice, canChoose, onChoose, compact }: FixerAreaProps) {
  const t = useTranslations();
  if (dice.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transform: compact ? 'scale(0.7)' : undefined, transformOrigin: 'center center' }}>
        <span style={{ fontFamily: 'var(--font-blender)', fontSize: 9, color: '#3a3a4a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('game.noDice')}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transform: compact ? 'scale(0.7)' : undefined, transformOrigin: 'center center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
        {dice.map((die, i) => {
          const isD20Last = die.type === 'd20' && dice.length > 1;
          const selectable = canChoose && !isD20Last;
          const color = DIE_COLORS[die.type];
          const clip = DIE_CLIPS[die.type];
          const isSquare = die.type === 'd6';

          return (
            <motion.div
              key={die.id}
              style={{
                position: 'relative',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: selectable ? 'pointer' : 'default',
                opacity: isD20Last ? 0.3 : 1,
              }}
              whileHover={selectable ? { scale: 1.2 } : undefined}
              whileTap={selectable ? { scale: 0.9 } : undefined}
              onClick={() => selectable && onChoose(i)}
            >
              {/* Outer shape */}
              <div style={{
                position: 'absolute', inset: 0,
                clipPath: isSquare ? 'none' : clip,
                borderRadius: isSquare ? 5 : 0,
                background: `linear-gradient(150deg, ${color}${selectable ? 'aa' : '30'} 0%, ${color}${selectable ? '25' : '08'} 50%, #0d0d18 100%)`,
                boxShadow: selectable ? `0 0 10px ${color}40, inset 0 1px 1px rgba(255,255,255,0.1)` : 'none',
              }} />
              {/* Inner shape */}
              <div style={{
                position: 'absolute', top: 4, left: 4, right: 4, bottom: 4,
                clipPath: isSquare ? 'none' : clip,
                borderRadius: isSquare ? 3 : 0,
                background: `linear-gradient(180deg, #111119 0%, #0d0d18 100%)`,
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6)',
              }} />
              {/* Label */}
              <span style={{
                position: 'relative', zIndex: 2,
                fontFamily: 'var(--font-blender)', fontSize: 9, fontWeight: 700,
                color: selectable ? color : '#444',
                textTransform: 'uppercase',
                textShadow: selectable ? `0 0 4px ${color}` : 'none',
              }}>
                {die.type}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
