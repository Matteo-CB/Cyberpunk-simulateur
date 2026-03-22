'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { GameState, PlayerID } from '@/lib/engine/types';
import { getPlayerState, getOpponent, CALL_COST } from '@/lib/engine/types';
import { getAvailableEddies, calculateEffectivePower } from '@/lib/engine/utils';
import { calculateContinuousPowerBonus } from '@/lib/effects/EffectEngine';

function getCardSet(id: string) {
  return id?.startsWith('b') ? 'spoiler' : id?.startsWith('n') ? 'promo' : 'alpha';
}

interface DefenseOverlayProps {
  gameState: GameState;
  myPlayer: PlayerID;
  onUseBlocker: (blockerInstanceId: string) => void;
  onCallLegend: (legendIndex: number) => void;
  onDecline: () => void;
}

export default function DefenseOverlay({ gameState, myPlayer, onUseBlocker, onCallLegend, onDecline }: DefenseOverlayProps) {
  const t = useTranslations();
  const locale = useLocale();
  if (!gameState.currentAttack) return null;

  const { attackerInstanceId, attackerPlayer, targetType, targetInstanceId } = gameState.currentAttack;
  const attackerState = getPlayerState(gameState, attackerPlayer);
  const defenderState = getPlayerState(gameState, myPlayer);
  const attacker = attackerState.field.find((u) => u.instanceId === attackerInstanceId);
  if (!attacker) return null;

  const attackerPower = calculateEffectivePower(attacker) + calculateContinuousPowerBonus(gameState, attackerPlayer, attacker);
  const target = targetType === 'unit' && targetInstanceId
    ? defenderState.field.find((u) => u.instanceId === targetInstanceId) : null;
  const targetPower = target
    ? calculateEffectivePower(target) + calculateContinuousPowerBonus(gameState, myPlayer, target) : 0;

  const blockers = defenderState.field.filter((u) => {
    if (u.isSpent) return false;
    return u.card.keywords.includes('Blocker') || u.temporaryBlocker || u.gear.some((g) => g.keywords.includes('Blocker'));
  });
  const isUnblockable = attacker.card.id === 'a012' && attackerState.streetCred >= 7;

  const canCallLegend = !defenderState.hasCalledInDefenseThisTurn && getAvailableEddies(defenderState) >= CALL_COST;
  const callableLegends = canCallLegend
    ? defenderState.legends.map((l, i) => ({ legend: l, index: i })).filter(({ legend }) => !legend.isFaceUp && !legend.isOnField)
    : [];

  const isFight = targetType === 'unit';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2,2,8,0.9)',
      }}
    >
      {/* Red scanlines for danger */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,60,0.02) 3px, rgba(255,0,60,0.02) 6px)',
      }} />

      {/* Horizontal threat lines */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', top: '25%', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,0,60,0.3), transparent)',
          transformOrigin: 'center',
        }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          position: 'absolute', bottom: '25%', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,0,60,0.2), transparent)',
          transformOrigin: 'center',
        }}
      />

      <motion.div
        initial={{ scale: 0.75, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          padding: '28px 28px 22px', position: 'relative',
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a12 100%)',
          border: '1px solid rgba(255,0,60,0.2)',
          borderRadius: 16, maxWidth: 500, width: '94%',
          maxHeight: '88vh', overflow: 'auto',
          boxShadow: '0 0 80px rgba(255,0,60,0.1), 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,0,60,0.1)',
        }}
      >
        {/* Corner accents */}
        {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', ...pos, width: 20, height: 20, pointerEvents: 'none',
            borderTop: pos.top !== undefined ? '2px solid rgba(255,0,60,0.4)' : 'none',
            borderBottom: pos.bottom !== undefined ? '2px solid rgba(255,0,60,0.4)' : 'none',
            borderLeft: pos.left !== undefined ? '2px solid rgba(255,0,60,0.4)' : 'none',
            borderRight: pos.right !== undefined ? '2px solid rgba(255,0,60,0.4)' : 'none',
            borderRadius: pos.top !== undefined && pos.left !== undefined ? '16px 0 0 0' :
                         pos.top !== undefined && pos.right !== undefined ? '0 16px 0 0' :
                         pos.bottom !== undefined && pos.left !== undefined ? '0 0 0 16px' : '0 0 16px 0',
          }} />
        ))}

        {/* THREAT badge */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          style={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-refinery), sans-serif', fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.25em',
            color: '#0a0a12', background: '#ff003c',
            padding: '4px 22px', borderRadius: 4,
            boxShadow: '0 0 24px rgba(255,0,60,0.5)',
          }}
        >
          {isFight ? t('effect.fight') : t('effect.breach')}
        </motion.div>

        {/* Battle display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          {/* Attacker */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div style={{
              position: 'relative', width: 90, height: 126, borderRadius: 8, overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: -10,
                background: 'radial-gradient(ellipse, rgba(255,0,60,0.2) 0%, transparent 70%)',
                filter: 'blur(10px)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: 8, overflow: 'hidden',
                border: '2px solid rgba(255,0,60,0.5)',
                boxShadow: '0 0 20px rgba(255,0,60,0.2)',
              }}>
                <Image
                  src={`/images/cards/${getCardSet(attacker.card.id)}/${attacker.card.id}.webp`}
                  alt={locale === 'fr' ? attacker.card.name_fr : attacker.card.name_en} fill style={{ objectFit: 'cover' }} sizes="90px"
                />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 11, color: '#e0e8f0', fontWeight: 700 }}>
              {locale === 'fr' ? attacker.card.name_fr : attacker.card.name_en}
            </span>
            <div style={{
              fontFamily: 'var(--font-refinery), sans-serif', fontSize: 20, fontWeight: 700,
              color: '#ff003c', textShadow: '0 0 12px rgba(255,0,60,0.4)',
            }}>
              {attackerPower}
            </div>
          </motion.div>

          {/* VS separator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 500 }}
            style={{
              fontFamily: 'var(--font-refinery), sans-serif', fontSize: 16,
              color: '#fcee09', textShadow: '0 0 10px rgba(252,238,9,0.4)',
              padding: '4px 8px',
            }}
          >
            {t('effect.vs')}
          </motion.div>

          {/* Target / Direct attack */}
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            {target ? (
              <>
                <div style={{
                  position: 'relative', width: 90, height: 126, borderRadius: 8, overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: -10,
                    background: 'radial-gradient(ellipse, rgba(0,240,255,0.15) 0%, transparent 70%)',
                    filter: 'blur(10px)', pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'relative', width: '100%', height: '100%',
                    borderRadius: 8, overflow: 'hidden',
                    border: '2px solid rgba(0,240,255,0.4)',
                  }}>
                    <Image
                      src={`/images/cards/${getCardSet(target.card.id)}/${target.card.id}.webp`}
                      alt={locale === 'fr' ? target.card.name_fr : target.card.name_en} fill style={{ objectFit: 'cover' }} sizes="90px"
                    />
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 11, color: '#e0e8f0', fontWeight: 700 }}>
                  {locale === 'fr' ? target.card.name_fr : target.card.name_en}
                </span>
                <div style={{
                  fontFamily: 'var(--font-refinery), sans-serif', fontSize: 20, fontWeight: 700,
                  color: '#00f0ff', textShadow: '0 0 12px rgba(0,240,255,0.4)',
                }}>
                  {targetPower}
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '24px 20px', border: '2px dashed rgba(252,238,9,0.2)',
                borderRadius: 10, background: 'rgba(252,238,9,0.03)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-refinery), sans-serif', fontSize: 16,
                  color: '#fcee09', textShadow: '0 0 8px rgba(252,238,9,0.3)',
                }}>
                  {t('effect.direct')}
                </span>
                <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 10, color: '#6a6a7a', textTransform: 'uppercase' }}>
                  {t('effect.stealingGigs')}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, #2a2a3a, transparent)' }} />

        {/* Response label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-refinery), sans-serif', fontSize: 12,
            color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: '0.15em',
          }}
        >
          {t('effect.countermeasures')}
        </motion.span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {/* Blockers */}
          {!isUnblockable && blockers.map((blocker, i) => (
            <motion.button
              key={blocker.instanceId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 18px rgba(34,197,94,0.25)', borderColor: 'rgba(34,197,94,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onUseBlocker(blocker.instanceId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'linear-gradient(90deg, rgba(34,197,94,0.06) 0%, transparent 100%)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 8, cursor: 'pointer', width: '100%',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                position: 'relative', width: 36, height: 50, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                border: '1px solid rgba(34,197,94,0.3)',
              }}>
                <Image
                  src={`/images/cards/${getCardSet(blocker.card.id)}/${blocker.card.id}.webp`}
                  alt={locale === 'fr' ? blocker.card.name_fr : blocker.card.name_en} fill style={{ objectFit: 'cover' }} sizes="36px"
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
                  {t('effect.blockWith', { name: locale === 'fr' ? blocker.card.name_fr : blocker.card.name_en })}
                </span>
                <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 10, color: '#5a6a7a' }}>
                  {t('effect.power', { power: calculateEffectivePower(blocker) })}
                </span>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
            </motion.button>
          ))}

          {isUnblockable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{
                padding: '10px 14px', background: 'rgba(255,0,60,0.05)',
                border: '1px solid rgba(255,0,60,0.15)', borderRadius: 8,
                fontFamily: 'var(--font-blender), sans-serif', fontSize: 12,
                color: '#ff003c', textAlign: 'center', fontWeight: 600,
              }}
            >
              {t('effect.unblockable')}
            </motion.div>
          )}

          {/* Call Legend */}
          {callableLegends.map(({ index }, i) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 18px rgba(255,215,0,0.2)', borderColor: 'rgba(255,215,0,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onCallLegend(index)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 8, cursor: 'pointer', width: '100%',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                width: 36, height: 50, borderRadius: 4,
                background: '#1a1a25', border: '1px solid rgba(255,215,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'var(--font-refinery), sans-serif', fontSize: 20, color: '#ffd700' }}>?</span>
              </div>
              <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 13, fontWeight: 700, color: '#ffd700' }}>
                {t('effect.callLegendCost')}
              </span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffd700', boxShadow: '0 0 6px rgba(255,215,0,0.6)' }} />
            </motion.button>
          ))}

          {/* Accept/Decline */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 14px rgba(255,0,60,0.2)', borderColor: 'rgba(255,0,60,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onDecline}
            style={{
              padding: '12px 14px',
              background: 'linear-gradient(90deg, rgba(255,0,60,0.06) 0%, transparent 100%)',
              border: '1px solid rgba(255,0,60,0.2)',
              borderRadius: 8, cursor: 'pointer', width: '100%',
              fontFamily: 'var(--font-refinery), sans-serif', fontSize: 13,
              color: '#ff003c', textTransform: 'uppercase', letterSpacing: '0.1em',
              textAlign: 'center', transition: 'border-color 0.2s',
            }}
          >
            {t('effect.acceptAttack')}
          </motion.button>
        </div>

        {/* Bottom neon */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
            background: 'linear-gradient(90deg, transparent, #ff003c, transparent)',
            borderRadius: '0 0 16px 16px', transformOrigin: 'center',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
