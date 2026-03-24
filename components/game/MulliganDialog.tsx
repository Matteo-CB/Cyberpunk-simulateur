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
      style={{ background: 'rgba(2,2,8,0.92)', padding: 10 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'clamp(12px, 3vw, 24px)',
          padding: 'clamp(16px, 4vw, 36px) clamp(14px, 3vw, 32px)',
          borderRadius: 16,
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
          border: '1px solid rgba(0,240,255,0.2)',
          maxWidth: 700, width: '94%',
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 0 60px rgba(0,240,255,0.08), 0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <h2 className="font-refinery" style={{
          fontSize: 'clamp(18px, 5vw, 28px)', letterSpacing: '0.15em', color: '#00f0ff',
          textShadow: '0 0 20px rgba(0,240,255,0.3)',
        }}>
          {t('game.startingHand')}
        </h2>
        <p className="font-blender" style={{ color: '#6a7a8a', fontSize: 'clamp(11px, 2.5vw, 13px)', textAlign: 'center', maxWidth: 400 }}>
          {t('game.startingHandDesc')}
        </p>

        <div style={{ display: 'flex', gap: 'clamp(4px, 1.5vw, 10px)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {hand.map((card, i) => (
            <motion.div
              key={`${card.id}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ width: 'clamp(55px, 14vw, 100px)' }}
            >
              <CardFace card={card} size="sm" />
            </motion.div>
          ))}
        </div>

        <div style={{ height: 1, width: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)' }} />

        <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 16px)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
            whileTap={{ scale: 0.95 }}
            className="font-blender cursor-pointer"
            style={{
              fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: 'clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 36px)', borderRadius: 10,
              background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.4)',
              color: '#22c55e',
            }}
            onClick={() => onDecision(false)}
          >
            {t('game.keepHand')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,0,60,0.25)' }}
            whileTap={{ scale: 0.95 }}
            className="font-blender cursor-pointer"
            style={{
              fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: 'clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 36px)', borderRadius: 10,
              background: 'rgba(255,0,60,0.06)', border: '1px solid rgba(255,0,60,0.4)',
              color: '#ff003c',
            }}
            onClick={() => onDecision(true)}
          >
            {t('game.mulligan')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
