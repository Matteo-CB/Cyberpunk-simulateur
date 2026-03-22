'use client';

import { motion } from 'framer-motion';
import type { DieType } from '@/lib/engine/types';

export const DIE_COLORS: Record<DieType, string> = {
  d4: '#ff003c', d6: '#fcee09', d8: '#22c55e',
  d10: '#00f0ff', d12: '#a855f7', d20: '#ffd700',
};

interface Die3DProps {
  type: DieType;
  value?: number;
  size?: number;
  interactive?: boolean;
  onClick?: () => void;
}

export default function Die3D({ type, value, size = 48, interactive = false, onClick }: Die3DProps) {
  const color = DIE_COLORS[type];
  const scale = size / 48;

  const valStyle: React.CSSProperties = {
    fontFamily: 'var(--font-blender), sans-serif',
    fontWeight: 700, fontSize: 18 * scale, lineHeight: 1,
    color: '#fff', textShadow: `0 0 6px ${color}, 0 1px 2px rgba(0,0,0,0.8)`,
    position: 'relative', zIndex: 2,
  };
  const lblStyle: React.CSSProperties = {
    fontFamily: 'var(--font-blender), sans-serif',
    fontSize: 9 * scale, fontWeight: 600, letterSpacing: '0.05em',
    color, opacity: 0.85, textTransform: 'uppercase',
    position: 'relative', zIndex: 2, marginTop: 1,
  };
  const glow = `0 0 14px ${color}50, 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.12)`;
  const base = `0 4px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08)`;
  const shadow = interactive ? glow : base;
  const displayVal = value !== undefined ? value : '';

  const wrapProps = {
    style: {
      width: size, height: size * (type === 'd20' ? 1.08 : type === 'd12' ? 1 : 1),
      position: 'relative' as const, cursor: interactive ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const,
      ...(type === 'd6' ? { perspective: 200 * scale } : {}),
    },
    whileHover: interactive ? { scale: 1.18 } : undefined,
    whileTap: interactive ? { scale: 0.95 } : undefined,
    onClick: interactive ? onClick : undefined,
  };

  const shapes: Record<DieType, { outer: string; inner: string }> = {
    d4: { outer: 'polygon(50% 2%, 4% 94%, 96% 94%)', inner: 'polygon(50% 8%, 10% 90%, 90% 90%)' },
    d6: { outer: 'none', inner: 'none' },
    d8: { outer: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', inner: 'polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)' },
    d10: { outer: 'polygon(50% 0%, 98% 38%, 80% 98%, 20% 98%, 2% 38%)', inner: 'polygon(50% 6%, 95% 40%, 78% 95%, 22% 95%, 5% 40%)' },
    d12: { outer: 'polygon(50% 0%, 100% 32%, 88% 96%, 12% 96%, 0% 32%)', inner: 'polygon(50% 6%, 96% 35%, 85% 93%, 15% 93%, 4% 35%)' },
    d20: { outer: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', inner: 'polygon(50% 4%, 96% 27%, 96% 73%, 50% 96%, 4% 73%, 4% 27%)' },
  };

  if (type === 'd6') {
    return (
      <motion.div {...wrapProps}>
        <div style={{
          position: 'absolute', inset: 2 * scale, borderRadius: 6 * scale,
          background: `linear-gradient(145deg, ${color}55 0%, #0d0d18 40%, #111119 100%)`,
          border: `${1.5 * scale}px solid ${color}60`, boxShadow: shadow,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transform: 'rotateX(5deg) rotateY(-5deg)',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6 * scale, borderRadius: `${6 * scale}px ${6 * scale}px 0 0`, background: `linear-gradient(180deg, ${color}30, transparent)` }} />
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6 * scale, borderRadius: `${6 * scale}px 0 0 ${6 * scale}px`, background: `linear-gradient(90deg, ${color}20, transparent)` }} />
          <span style={valStyle}>{displayVal}</span>
          <span style={lblStyle}>{type}</span>
        </div>
      </motion.div>
    );
  }

  const shape = shapes[type];
  return (
    <motion.div {...wrapProps}>
      <div style={{ position: 'absolute', inset: 0, clipPath: shape.outer, background: `linear-gradient(160deg, ${color}aa 0%, ${color}30 45%, #0d0d18 100%)`, boxShadow: shadow }} />
      <div style={{ position: 'absolute', top: 5 * scale, left: 5 * scale, right: 5 * scale, bottom: 4 * scale, clipPath: shape.inner, background: 'linear-gradient(180deg, #111119 0%, #0d0d18 100%)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: type === 'd4' ? 6 * scale : type === 'd10' ? 4 * scale : 0, position: 'relative', zIndex: 2 }}>
        <span style={valStyle}>{displayVal}</span>
        <span style={lblStyle}>{type}</span>
      </div>
    </motion.div>
  );
}
