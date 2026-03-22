'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { PendingAction, GameState, PlayerID } from '@/lib/engine/types';

interface ChoiceDialogProps {
  pendingAction: PendingAction;
  gameState: GameState;
  myPlayer: PlayerID;
  onChoice: (pendingActionId: string, selectedOption: string[]) => void;
}

const OPTION_COLORS = ['#22c55e', '#ff003c', '#00f0ff', '#fcee09', '#a855f7', '#ffd700'];

function getCardSet(id: string) {
  return id?.startsWith('b') ? 'spoiler' : id?.startsWith('n') ? 'promo' : 'alpha';
}

export default function ChoiceDialog({ pendingAction, onChoice }: ChoiceDialogProps) {
  const t = useTranslations();
  const cardId = pendingAction.sourceCardId || '';
  const cardSet = getCardSet(cardId);
  const cardName = pendingAction.description?.split(':')[0]?.trim() || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,2,8,0.88)',
      }}
    >
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.012) 2px, rgba(0,240,255,0.012) 4px)',
      }} />

      <motion.div
        initial={{ scale: 0.75, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 24 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          padding: '28px 28px 24px', position: 'relative',
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
          border: '1px solid rgba(0,240,255,0.15)',
          borderRadius: 16, maxWidth: 440, width: '92%',
          boxShadow: '0 0 60px rgba(0,240,255,0.08), 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(0,240,255,0.1)',
        }}
      >
        {/* Corner brackets */}
        {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', ...pos, width: 16, height: 16, pointerEvents: 'none',
            borderTop: pos.top !== undefined ? '2px solid rgba(0,240,255,0.3)' : 'none',
            borderBottom: pos.bottom !== undefined ? '2px solid rgba(0,240,255,0.3)' : 'none',
            borderLeft: pos.left !== undefined ? '2px solid rgba(0,240,255,0.3)' : 'none',
            borderRight: pos.right !== undefined ? '2px solid rgba(0,240,255,0.3)' : 'none',
            borderRadius: pos.top !== undefined && pos.left !== undefined ? '16px 0 0 0' :
                         pos.top !== undefined && pos.right !== undefined ? '0 16px 0 0' :
                         pos.bottom !== undefined && pos.left !== undefined ? '0 0 0 16px' : '0 0 16px 0',
          }} />
        ))}

        {/* DECISION badge */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          style={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-refinery), sans-serif', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.2em',
            color: '#0a0a12', background: '#fcee09',
            padding: '4px 18px', borderRadius: 4,
            boxShadow: '0 0 20px rgba(252,238,9,0.4)',
          }}
        >
          {t('effect.decision')}
        </motion.div>

        {/* Card image */}
        {cardId && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 300 }}
            style={{ position: 'relative', width: 80, height: 112, borderRadius: 8, overflow: 'hidden' }}
          >
            <div style={{
              position: 'absolute', inset: -12,
              background: 'radial-gradient(ellipse, rgba(252,238,9,0.15) 0%, transparent 70%)',
              filter: 'blur(10px)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'relative', width: '100%', height: '100%',
              borderRadius: 8, overflow: 'hidden',
              border: '2px solid rgba(252,238,9,0.3)',
              boxShadow: '0 0 20px rgba(252,238,9,0.1)',
            }}>
              <Image src={`/images/cards/${cardSet}/${cardId}.webp`} alt={cardName} fill style={{ objectFit: 'cover' }} sizes="80px" />
            </div>
          </motion.div>
        )}

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            fontFamily: 'var(--font-blender), sans-serif',
            fontSize: 14, color: '#c0c8d0', textAlign: 'center',
            lineHeight: 1.5, margin: 0, maxWidth: 360,
          }}
        >
          {pendingAction.descriptionKey
            ? t(pendingAction.descriptionKey, (pendingAction.metadata || {}) as Record<string, string>)
            : pendingAction.description}
        </motion.p>

        {/* Option buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
          {pendingAction.options.map((option, i) => {
            const label = pendingAction.optionLabels?.[i] || option;
            const color = OPTION_COLORS[i % OPTION_COLORS.length];
            return (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 400 }}
                whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${color}25`, borderColor: `${color}70` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onChoice(pendingAction.id, [option])}
                style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 14, fontWeight: 700, color,
                  background: `linear-gradient(90deg, ${color}08 0%, transparent 100%)`,
                  border: `1px solid ${color}30`,
                  borderRadius: 8, padding: '12px 20px',
                  cursor: 'pointer', textTransform: 'uppercase',
                  letterSpacing: '0.08em', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, boxShadow: `0 0 8px ${color}60`,
                  flexShrink: 0,
                }} />
                {label}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
            background: 'linear-gradient(90deg, transparent, #fcee09, transparent)',
            borderRadius: '0 0 16px 16px', transformOrigin: 'center',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
