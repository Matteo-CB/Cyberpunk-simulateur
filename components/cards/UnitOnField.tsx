'use client';

import { motion } from 'framer-motion';
import CardFace from './CardFace';
import type { CardData } from '@/lib/data/types';

interface UnitOnFieldProps {
  card: CardData;
  instanceId: string;
  isSpent: boolean;
  gear: CardData[];
  effectivePower: number;
  playedThisTurn: boolean;
  isTargetable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function UnitOnField({
  card, isSpent, gear, effectivePower, playedThisTurn,
  isTargetable, isSelected, onClick,
}: UnitOnFieldProps) {
  return (
    <motion.div
      className="relative cursor-pointer"
      animate={{ rotate: isSpent ? 90 : 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
      onClick={onClick}
      whileHover={isTargetable ? { scale: 1.05 } : undefined}
    >
      <CardFace
        card={card}
        size="sm"
        isSpent={false}
        showGlow={isSelected || isTargetable}
      />

      {/* Power overlay */}
      <div
        className="absolute -bottom-1 -right-1 flex items-center justify-center font-blender font-bold text-xs rounded"
        style={{
          width: 24, height: 18,
          background: '#0a0a12',
          border: '1px solid #00f0ff',
          color: effectivePower > (card.power || 0) ? '#22c55e' : '#e0e8f0',
          zIndex: 10,
        }}
      >
        {effectivePower}
      </div>

      {/* Gear indicators */}
      {gear.length > 0 && (
        <div className="absolute -top-1 -left-1 flex gap-0.5" style={{ zIndex: 10 }}>
          {gear.map((g, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 8, height: 8,
                background: '#fcee09',
                border: '1px solid #0a0a12',
              }}
              title={g.name_en}
            />
          ))}
        </div>
      )}

      {/* Summoning sickness indicator */}
      {playedThisTurn && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <span className="font-blender text-[8px] uppercase tracking-wider" style={{ color: '#fcee09' }}>
            DEPLOYED
          </span>
        </div>
      )}

      {/* Target highlight */}
      {isTargetable && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ boxShadow: ['0 0 8px #00f0ff60', '0 0 16px #00f0ff90', '0 0 8px #00f0ff60'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ border: '2px solid #00f0ff' }}
        />
      )}
    </motion.div>
  );
}
