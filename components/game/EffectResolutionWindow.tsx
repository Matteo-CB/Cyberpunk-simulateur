'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { EffectAnimationData, PendingAction } from '@/lib/engine/types';

const TRIGGER_COLORS: Record<string, string> = {
  PLAY: '#22c55e', ATTACK: '#ff003c', FLIP: '#a855f7',
  CALL: '#ffd700', PASSIVE: '#00f0ff', DEFEATED: '#ff003c', SPEND: '#fcee09',
};
// TRIGGER_ICONS will be resolved via translations inside the component

function getCardSet(id: string) {
  return id.startsWith('b') ? 'spoiler' : id.startsWith('n') ? 'promo' : 'alpha';
}

interface Props {
  animationQueue: EffectAnimationData[];
  pendingConfirm: PendingAction | null;
  onDismiss: () => void;
  onConfirm: (id: string, targets: string[]) => void;
  onSkip: (id: string) => void;
}

export default function EffectResolutionWindow({ animationQueue, pendingConfirm, onDismiss, onConfirm, onSkip }: Props) {
  const t = useTranslations();

  const TRIGGER_ICONS: Record<string, string> = {
    PLAY: t('effect.deploy'), ATTACK: t('effect.strike'), FLIP: t('effect.reveal'),
    CALL: t('effect.summon'), PASSIVE: t('effect.sync'), DEFEATED: t('effect.flatlined'), SPEND: t('effect.burn'),
  };

  useEffect(() => {
    if (animationQueue.length > 0 && !pendingConfirm) {
      const timer = setTimeout(onDismiss, 3200);
      return () => clearTimeout(timer);
    }
  }, [animationQueue, pendingConfirm, onDismiss]);

  const item = animationQueue[0];
  const show = pendingConfirm || item;
  if (!show) return null;

  const cardId = pendingConfirm?.sourceCardId || item?.cardId || '';
  const cardName = pendingConfirm?.description?.split(':')[0]?.trim() || item?.cardName || '';
  const trigger = item?.triggerType || 'PLAY';
  const color = TRIGGER_COLORS[trigger] || '#00f0ff';
  const icon = TRIGGER_ICONS[trigger] || trigger;
  const rawDesc = pendingConfirm?.description || item?.description || '';
  const desc = pendingConfirm?.descriptionKey
    ? t(pendingConfirm.descriptionKey, (pendingConfirm.metadata || {}) as Record<string, string>)
    : rawDesc;
  const result = pendingConfirm?.resultDescription || item?.resultDescription || '';

  const handleOK = useCallback(() => {
    if (pendingConfirm) onConfirm(pendingConfirm.id, pendingConfirm.options.slice(0, 1));
    else onDismiss();
  }, [pendingConfirm, onConfirm, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        key={pendingConfirm?.id || item?.timestamp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 950,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2,2,8,0.88)',
        }}
      >
        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.015) 2px, rgba(0,240,255,0.015) 4px)',
        }} />

        {/* Horizontal neon lines */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '30%', left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
            transformOrigin: 'center',
          }}
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          style={{
            position: 'absolute', bottom: '30%', left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
            transformOrigin: 'center',
          }}
        />

        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            padding: '28px 32px', position: 'relative',
            background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
            border: `1px solid ${color}25`,
            borderRadius: 16,
            maxWidth: 440, width: '92%',
            boxShadow: `0 0 60px ${color}12, 0 0 120px ${color}06, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 ${color}15`,
          }}
        >
          {/* Corner accents */}
          {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos, width: 20, height: 20, pointerEvents: 'none',
              borderTop: pos.top !== undefined ? `2px solid ${color}50` : 'none',
              borderBottom: pos.bottom !== undefined ? `2px solid ${color}50` : 'none',
              borderLeft: pos.left !== undefined ? `2px solid ${color}50` : 'none',
              borderRight: pos.right !== undefined ? `2px solid ${color}50` : 'none',
              borderRadius: pos.top !== undefined && pos.left !== undefined ? '16px 0 0 0' :
                           pos.top !== undefined && pos.right !== undefined ? '0 16px 0 0' :
                           pos.bottom !== undefined && pos.left !== undefined ? '0 0 0 16px' : '0 0 16px 0',
            }} />
          ))}

          {/* Trigger badge */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
            style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-refinery), sans-serif', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.2em',
              color: '#0a0a12', background: color,
              padding: '4px 18px', borderRadius: 4,
              boxShadow: `0 0 20px ${color}50, 0 4px 8px rgba(0,0,0,0.5)`,
            }}
          >
            {icon}
          </motion.div>

          {/* Card image with glow */}
          {cardId && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              style={{
                position: 'relative', width: 130, height: 182,
                borderRadius: 10, overflow: 'hidden', marginTop: 8,
              }}
            >
              {/* Glow behind card */}
              <div style={{
                position: 'absolute', inset: -20,
                background: `radial-gradient(ellipse, ${color}25 0%, transparent 70%)`,
                filter: 'blur(15px)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${color}50`,
                boxShadow: `0 0 30px ${color}20, inset 0 0 20px rgba(0,0,0,0.5)`,
              }}>
                <Image
                  src={`/images/cards/${getCardSet(cardId)}/${cardId}.webp`}
                  alt={cardName} fill style={{ objectFit: 'cover' }} sizes="130px"
                />
                {/* Holographic shimmer */}
                <motion.div
                  animate={{ x: [-200, 200] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(105deg, transparent 40%, ${color}15 50%, transparent 60%)`,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Card name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-refinery), sans-serif',
              fontSize: 20, fontWeight: 700,
              color: '#e0e8f0', textAlign: 'center',
              textShadow: `0 0 20px ${color}30`,
            }}
          >
            {cardName}
          </motion.div>

          {/* Effect description */}
          {desc && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 12, color: '#6a7a8a', textAlign: 'center',
                lineHeight: 1.5, margin: 0, maxWidth: 340,
              }}
            >
              {desc}
            </motion.p>
          )}

          {/* Result text */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 400 }}
              style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 15, fontWeight: 700, color, textAlign: 'center',
                textShadow: `0 0 12px ${color}40`,
                padding: '8px 20px',
                background: `linear-gradient(180deg, ${color}08 0%, ${color}03 100%)`,
                borderRadius: 8,
                border: `1px solid ${color}20`,
              }}
            >
              {result}
            </motion.div>
          )}

          {/* Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: 10, marginTop: 4 }}
          >
            <motion.button
              whileHover={{ scale: 1.08, boxShadow: `0 0 24px ${color}35` }}
              whileTap={{ scale: 0.92 }}
              onClick={handleOK}
              style={{
                fontFamily: 'var(--font-refinery), sans-serif',
                fontSize: 14, fontWeight: 700, color,
                background: `${color}10`, border: `1px solid ${color}40`,
                borderRadius: 8, padding: '10px 36px', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.15em',
                boxShadow: `0 0 12px ${color}15`,
              }}
            >
              {t('effect.proceed')}
            </motion.button>
            {pendingConfirm?.isOptional && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSkip(pendingConfirm.id)}
                style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 12, color: '#4a4a5a', background: 'transparent',
                  border: '1px solid #2a2a3a', borderRadius: 8,
                  padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                {t('effect.skip')}
              </motion.button>
            )}
          </motion.div>

          {/* Bottom neon line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              borderRadius: '0 0 16px 16px', transformOrigin: 'center',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
