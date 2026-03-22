'use client';

import { motion } from 'framer-motion';
import type { GamePhase } from '@/lib/engine/types';

interface ActionBarProps {
  phase: GamePhase;
  isMyTurn: boolean;
  canSell: boolean;
  canCall: boolean;
  canEndPlay: boolean;
  canEndAttack: boolean;
  onSell?: () => void;
  onEndPlay?: () => void;
  onEndAttack?: () => void;
  onForfeit?: () => void;
}

const BTN_STYLE = {
  base: {
    height: 40,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 12,
    letterSpacing: 2,
    background: '#111119',
    border: '1px solid #1e2030',
    color: '#7a8a9a',
    cursor: 'pointer',
    borderRadius: 4,
    fontFamily: 'BlenderPro, sans-serif',
    textTransform: 'uppercase' as const,
    transition: 'all 0.2s',
  },
  active: {
    border: '1px solid #00f0ff',
    color: '#00f0ff',
    boxShadow: '0 0 12px rgba(0,240,255,0.15)',
  },
  danger: {
    border: '1px solid #ff003c40',
    color: '#ff003c80',
  },
};

export default function ActionBar({
  phase, isMyTurn, canEndPlay, canEndAttack, onEndPlay, onEndAttack, onForfeit,
}: ActionBarProps) {
  if (!isMyTurn) {
    return (
      <div className="flex items-center justify-center py-3">
        <motion.div
          className="font-blender text-sm uppercase tracking-widest"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: '#7a8a9a' }}
        >
          Opponent&apos;s Turn...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      {/* Phase indicator */}
      <div
        className="font-blender text-xs uppercase tracking-widest px-3 py-1 rounded"
        style={{ background: '#00f0ff15', border: '1px solid #00f0ff40', color: '#00f0ff' }}
      >
        {phase === 'play' ? 'PLAY PHASE' : phase === 'attack' ? 'ATTACK PHASE' : phase.toUpperCase()}
      </div>

      {/* End Play Phase */}
      {phase === 'play' && canEndPlay && (
        <button
          style={{ ...BTN_STYLE.base, ...BTN_STYLE.active }}
          onClick={onEndPlay}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a25'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#111119'; }}
        >
          End Play Phase
        </button>
      )}

      {/* End Attack Phase */}
      {phase === 'attack' && canEndAttack && (
        <button
          style={{ ...BTN_STYLE.base, ...BTN_STYLE.active }}
          onClick={onEndAttack}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a25'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#111119'; }}
        >
          End Turn
        </button>
      )}

      {/* Forfeit */}
      <button
        style={{ ...BTN_STYLE.base, ...BTN_STYLE.danger }}
        onClick={onForfeit}
      >
        Forfeit
      </button>
    </div>
  );
}
