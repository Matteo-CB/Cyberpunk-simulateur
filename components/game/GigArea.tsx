'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { GigDie, DieType } from '@/lib/engine/types';

const DIE_COLORS: Record<DieType, string> = {
  d4: '#ff003c',
  d6: '#fcee09',
  d8: '#22c55e',
  d10: '#00f0ff',
  d12: '#a855f7',
  d20: '#ffd700',
};

interface GigAreaProps {
  dice: GigDie[];
  streetCred: number;
  label: string;
  compact?: boolean;
  isSelectable?: boolean;
  selectableIndices?: number[];
  onSelectDie?: (index: number) => void;
}

function Die3D({ die, index, isSelectable, onSelectDie }: {
  die: GigDie;
  index: number;
  isSelectable?: boolean;
  onSelectDie?: (index: number) => void;
}) {
  const color = DIE_COLORS[die.type];
  const isStolen = !!die.stolenFrom;

  const sharedValueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-blender), sans-serif',
    fontWeight: 700,
    fontSize: 18,
    lineHeight: 1,
    color: '#fff',
    textShadow: `0 0 6px ${color}, 0 1px 2px rgba(0,0,0,0.8)`,
    position: 'relative' as const,
    zIndex: 2,
  };

  const sharedLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-blender), sans-serif',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.05em',
    color,
    opacity: 0.85,
    textTransform: 'uppercase' as const,
    position: 'relative' as const,
    zIndex: 2,
    marginTop: 1,
  };

  const stolenOverlay: React.CSSProperties | undefined = isStolen ? {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(255, 0, 60, 0.15)',
    borderRadius: 'inherit',
    pointerEvents: 'none' as const,
    zIndex: 3,
  } : undefined;

  const baseShadow = `0 4px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)`;
  const glowShadow = `0 0 14px ${color}50, 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.12)`;

  const renderDie = () => {
    switch (die.type) {
      case 'd4': {
        // Triangle / pyramid shape via clip-path
        return (
          <motion.div
            style={{
              width: 48,
              height: 48,
              position: 'relative',
              cursor: isSelectable ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={isSelectable ? { scale: 1.18 } : undefined}
            whileTap={isSelectable ? { scale: 0.95 } : undefined}
            onClick={() => isSelectable && onSelectDie?.(index)}
          >
            {/* Triangle background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              clipPath: 'polygon(50% 2%, 4% 94%, 96% 94%)',
              background: `linear-gradient(170deg, ${color}cc 0%, ${color}40 50%, ${color}18 100%)`,
              boxShadow: isSelectable ? glowShadow : baseShadow,
            }} />
            {/* Inner triangle for depth */}
            <div style={{
              position: 'absolute',
              top: 6,
              left: 6,
              right: 6,
              bottom: 4,
              clipPath: 'polygon(50% 8%, 10% 90%, 90% 90%)',
              background: `linear-gradient(180deg, #0d0d18 0%, #161622 100%)`,
              boxShadow: `inset 0 2px 8px rgba(0,0,0,0.7)`,
            }} />
            {isStolen && <div style={{ ...stolenOverlay, clipPath: 'polygon(50% 2%, 4% 94%, 96% 94%)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 6, position: 'relative', zIndex: 2 }}>
              <span style={sharedValueStyle}>{die.value}</span>
              <span style={sharedLabelStyle}>{die.type}</span>
            </div>
          </motion.div>
        );
      }

      case 'd6': {
        // Cube with perspective and 3D faces
        return (
          <motion.div
            style={{
              width: 48,
              height: 48,
              position: 'relative',
              cursor: isSelectable ? 'pointer' : 'default',
              perspective: 200,
            }}
            whileHover={isSelectable ? { scale: 1.18 } : undefined}
            whileTap={isSelectable ? { scale: 0.95 } : undefined}
            onClick={() => isSelectable && onSelectDie?.(index)}
          >
            {/* Main face */}
            <div style={{
              position: 'absolute',
              inset: 2,
              borderRadius: 6,
              background: `linear-gradient(145deg, ${color}55 0%, #0d0d18 40%, #111119 100%)`,
              border: `1.5px solid ${color}60`,
              boxShadow: isSelectable ? glowShadow : baseShadow,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotateX(5deg) rotateY(-5deg)',
            }}>
              {/* Top edge highlight for 3D */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                borderRadius: '6px 6px 0 0',
                background: `linear-gradient(180deg, ${color}30, transparent)`,
              }} />
              {/* Left edge highlight for 3D */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: 6,
                borderRadius: '6px 0 0 6px',
                background: `linear-gradient(90deg, ${color}20, transparent)`,
              }} />
              {isStolen && <div style={{ ...stolenOverlay, borderRadius: 6 }} />}
              <span style={sharedValueStyle}>{die.value}</span>
              <span style={sharedLabelStyle}>{die.type}</span>
            </div>
          </motion.div>
        );
      }

      case 'd8': {
        // Diamond / octahedron
        return (
          <motion.div
            style={{
              width: 48,
              height: 48,
              position: 'relative',
              cursor: isSelectable ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={isSelectable ? { scale: 1.18 } : undefined}
            whileTap={isSelectable ? { scale: 0.95 } : undefined}
            onClick={() => isSelectable && onSelectDie?.(index)}
          >
            {/* Outer diamond */}
            <div style={{
              position: 'absolute',
              inset: 0,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: `linear-gradient(160deg, ${color}aa 0%, ${color}30 40%, #0d0d18 80%)`,
              boxShadow: isSelectable ? glowShadow : baseShadow,
            }} />
            {/* Inner diamond for depth */}
            <div style={{
              position: 'absolute',
              top: 5,
              left: 5,
              right: 5,
              bottom: 5,
              clipPath: 'polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)',
              background: `linear-gradient(180deg, #111119 0%, #0d0d18 100%)`,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)',
            }} />
            {/* Horizontal center line for facets */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 8,
              right: 8,
              height: 1,
              background: `${color}25`,
              transform: 'translateY(-0.5px)',
              zIndex: 1,
            }} />
            {isStolen && <div style={{ ...stolenOverlay, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <span style={sharedValueStyle}>{die.value}</span>
              <span style={sharedLabelStyle}>{die.type}</span>
            </div>
          </motion.div>
        );
      }

      case 'd10': {
        // Pentagonal shape
        return (
          <motion.div
            style={{
              width: 48,
              height: 48,
              position: 'relative',
              cursor: isSelectable ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={isSelectable ? { scale: 1.18 } : undefined}
            whileTap={isSelectable ? { scale: 0.95 } : undefined}
            onClick={() => isSelectable && onSelectDie?.(index)}
          >
            {/* Outer pentagon */}
            <div style={{
              position: 'absolute',
              inset: 0,
              clipPath: 'polygon(50% 0%, 98% 38%, 80% 98%, 20% 98%, 2% 38%)',
              background: `linear-gradient(160deg, ${color}90 0%, ${color}28 45%, #0d0d18 100%)`,
              boxShadow: isSelectable ? glowShadow : baseShadow,
            }} />
            {/* Inner pentagon */}
            <div style={{
              position: 'absolute',
              top: 5,
              left: 5,
              right: 5,
              bottom: 4,
              clipPath: 'polygon(50% 6%, 95% 40%, 78% 95%, 22% 95%, 5% 40%)',
              background: `linear-gradient(180deg, #111119 0%, #0d0d18 100%)`,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)',
            }} />
            {isStolen && <div style={{ ...stolenOverlay, clipPath: 'polygon(50% 0%, 98% 38%, 80% 98%, 20% 98%, 2% 38%)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4, position: 'relative', zIndex: 2 }}>
              <span style={sharedValueStyle}>{die.value}</span>
              <span style={sharedLabelStyle}>{die.type}</span>
            </div>
          </motion.div>
        );
      }

      case 'd12': {
        // Wider pentagon / dodecahedron face
        return (
          <motion.div
            style={{
              width: 52,
              height: 48,
              position: 'relative',
              cursor: isSelectable ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={isSelectable ? { scale: 1.18 } : undefined}
            whileTap={isSelectable ? { scale: 0.95 } : undefined}
            onClick={() => isSelectable && onSelectDie?.(index)}
          >
            {/* Outer wide pentagon */}
            <div style={{
              position: 'absolute',
              inset: 0,
              clipPath: 'polygon(50% 0%, 100% 32%, 88% 96%, 12% 96%, 0% 32%)',
              background: `linear-gradient(155deg, ${color}88 0%, ${color}22 50%, #0d0d18 100%)`,
              boxShadow: isSelectable ? glowShadow : baseShadow,
            }} />
            {/* Inner shape */}
            <div style={{
              position: 'absolute',
              top: 5,
              left: 5,
              right: 5,
              bottom: 4,
              clipPath: 'polygon(50% 6%, 96% 35%, 85% 93%, 15% 93%, 4% 35%)',
              background: `linear-gradient(180deg, #111119 0%, #0d0d18 100%)`,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)',
            }} />
            {/* Center facet line */}
            <div style={{
              position: 'absolute',
              top: '38%',
              left: 10,
              right: 10,
              height: 1,
              background: `${color}18`,
              zIndex: 1,
            }} />
            {isStolen && <div style={{ ...stolenOverlay, clipPath: 'polygon(50% 0%, 100% 32%, 88% 96%, 12% 96%, 0% 32%)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3, position: 'relative', zIndex: 2 }}>
              <span style={sharedValueStyle}>{die.value}</span>
              <span style={sharedLabelStyle}>{die.type}</span>
            </div>
          </motion.div>
        );
      }

      case 'd20': {
        // Larger hexagonal shape
        return (
          <motion.div
            style={{
              width: 54,
              height: 52,
              position: 'relative',
              cursor: isSelectable ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={isSelectable ? { scale: 1.18 } : undefined}
            whileTap={isSelectable ? { scale: 0.95 } : undefined}
            onClick={() => isSelectable && onSelectDie?.(index)}
          >
            {/* Outer hexagon */}
            <div style={{
              position: 'absolute',
              inset: 0,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: `linear-gradient(150deg, ${color}aa 0%, ${color}35 35%, #0d0d18 70%, ${color}10 100%)`,
              boxShadow: isSelectable ? glowShadow : baseShadow,
            }} />
            {/* Inner hexagon */}
            <div style={{
              position: 'absolute',
              top: 4,
              left: 4,
              right: 4,
              bottom: 4,
              clipPath: 'polygon(50% 4%, 96% 27%, 96% 73%, 50% 96%, 4% 73%, 4% 27%)',
              background: `linear-gradient(180deg, #131320 0%, #0d0d18 100%)`,
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
            }} />
            {/* Facet lines */}
            <div style={{
              position: 'absolute',
              top: '25%',
              left: 8,
              right: 8,
              height: 1,
              background: `${color}15`,
              zIndex: 1,
            }} />
            <div style={{
              position: 'absolute',
              top: '75%',
              left: 8,
              right: 8,
              height: 1,
              background: `${color}12`,
              zIndex: 1,
            }} />
            {isStolen && <div style={{ ...stolenOverlay, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <span style={{ ...sharedValueStyle, fontSize: 20 }}>{die.value}</span>
              <span style={sharedLabelStyle}>{die.type}</span>
            </div>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return renderDie();
}

export default function GigArea({ dice, streetCred, label, compact, isSelectable, selectableIndices, onSelectDie }: GigAreaProps) {
  const t = useTranslations();
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: compact ? 3 : 6,
      transform: compact ? 'scale(0.65)' : undefined,
      transformOrigin: 'center center',
    }}>
      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-blender), sans-serif',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: '#7a8a9a',
      }}>
        {label}
      </div>

      {/* Dice row */}
      <div style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {dice.map((die, i) => (
          <Die3D
            key={die.id}
            die={die}
            index={i}
            isSelectable={isSelectable || (selectableIndices && selectableIndices.includes(i))}
            onSelectDie={onSelectDie}
          />
        ))}
        {dice.length === 0 && (
          <div style={{
            fontFamily: 'var(--font-blender), sans-serif',
            fontSize: 11,
            color: '#3a4555',
            fontStyle: 'italic',
          }}>
            {t('game.noGigDice')}
          </div>
        )}
      </div>

      {/* Street Cred */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-blender), sans-serif',
        fontSize: 13,
      }}>
        <span
          style={{ color: '#ffd700', fontSize: 14 }}
          dangerouslySetInnerHTML={{ __html: '&#9733;' }}
        />
        <span style={{ color: '#e0e8f0', fontWeight: 600 }}>{streetCred}</span>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#7a8a9a',
        }}>
          {t('game.streetCred')}
        </span>
      </div>
    </div>
  );
}
