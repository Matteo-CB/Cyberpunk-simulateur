'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import CardFace from '@/components/cards/CardFace';
import type { CardData } from '@/lib/data/types';

interface MulliganDialogProps {
  hand: CardData[];
  onDecision: (doMulligan: boolean) => void;
}

export default function MulliganDialog({ hand, onDecision }: MulliganDialogProps) {
  const t = useTranslations();
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 p-8 rounded-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{ background: '#0a0a12', border: '1px solid #1e2030', maxWidth: 700 }}
      >
        <h2 className="font-refinery text-2xl tracking-wider" style={{ color: '#00f0ff' }}>
          {t('game.startingHand')}
        </h2>
        <p className="font-blender text-sm" style={{ color: '#7a8a9a' }}>
          {t('game.startingHandDesc')}
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          {hand.map((card, i) => (
            <motion.div
              key={`${card.id}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CardFace card={card} size="md" />
            </motion.div>
          ))}
        </div>

        <div style={{ height: 1, width: '100%', background: 'linear-gradient(to right, #00f0ff40, transparent)' }} />

        <div className="flex gap-4">
          <button
            className="font-blender text-sm uppercase tracking-widest px-8 py-3 rounded cursor-pointer transition-all"
            style={{ background: '#111119', border: '1px solid #22c55e', color: '#22c55e' }}
            onClick={() => onDecision(false)}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(34,197,94,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {t('game.keepHand')}
          </button>
          <button
            className="font-blender text-sm uppercase tracking-widest px-8 py-3 rounded cursor-pointer transition-all"
            style={{ background: '#111119', border: '1px solid #ff003c', color: '#ff003c' }}
            onClick={() => onDecision(true)}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(255,0,60,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {t('game.mulligan')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
