'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { PendingAction, GameState, PlayerID } from '@/lib/engine/types';
import { getPlayerState } from '@/lib/engine/types';

interface TargetSelectorProps {
  pendingAction: PendingAction;
  gameState: GameState;
  myPlayer: PlayerID;
  onSelect: (pendingActionId: string, selectedTargets: string[]) => void;
  onDecline?: (pendingActionId: string) => void;
}

function getCardSet(id: string) {
  return id?.startsWith('b') ? 'spoiler' : id?.startsWith('n') ? 'promo' : 'alpha';
}

export default function TargetSelector({ pendingAction, gameState, myPlayer, onSelect, onDecline }: TargetSelectorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [selected, setSelected] = useState<string[]>([]);
  const { type, options, optionLabels, optionCardIds, minSelections, maxSelections } = pendingAction;
  const description = pendingAction.descriptionKey
    ? t(pendingAction.descriptionKey, (pendingAction.metadata || {}) as Record<string, string>)
    : pendingAction.description;
  const sourceCardId = pendingAction.sourceCardId || '';
  const sourceSet = getCardSet(sourceCardId);
  const sourceName = pendingAction.description?.split(':')[0]?.trim() || '';

  const toggleSelection = (option: string) => {
    if (maxSelections === 1) {
      onSelect(pendingAction.id, [option]);
      return;
    }
    setSelected((prev) => {
      if (prev.includes(option)) return prev.filter((s) => s !== option);
      if (prev.length >= maxSelections) return prev;
      return [...prev, option];
    });
  };

  const canConfirm = selected.length >= minSelections && selected.length <= maxSelections;

  // Shared overlay background
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(2,2,8,0.88)',
  };

  // Shared scanlines
  const Scanlines = () => (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.012) 2px, rgba(0,240,255,0.012) 4px)',
    }} />
  );

  // Shared card header
  const CardHeader = ({ color, badge }: { color: string; badge: string }) => (
    <>
      {/* Badge */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
        style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-refinery), sans-serif', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.2em',
          color: '#0a0a12', background: color,
          padding: '4px 18px', borderRadius: 4,
          boxShadow: `0 0 20px ${color}50`,
        }}
      >
        {badge}
      </motion.div>
      {/* Source card mini */}
      {sourceCardId && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: 'spring' }}
          style={{ position: 'relative', width: 60, height: 84, borderRadius: 6, overflow: 'hidden', marginTop: 6 }}
        >
          <div style={{
            position: 'absolute', inset: -8,
            background: `radial-gradient(ellipse, ${color}20 0%, transparent 70%)`,
            filter: 'blur(8px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: 6, overflow: 'hidden',
            border: `1px solid ${color}40`,
          }}>
            <Image src={`/images/cards/${sourceSet}/${sourceCardId}.webp`} alt={sourceName} fill style={{ objectFit: 'cover' }} sizes="60px" />
          </div>
        </motion.div>
      )}
      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          fontFamily: 'var(--font-blender), sans-serif',
          fontSize: 13, color: '#b0b8c0', textAlign: 'center',
          lineHeight: 1.5, margin: 0, maxWidth: 380,
        }}
      >
        {description}
      </motion.p>
    </>
  );

  // Shared corner brackets
  const Corners = ({ color }: { color: string }) => (
    <>
      {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 16, height: 16, pointerEvents: 'none',
          borderTop: pos.top !== undefined ? `2px solid ${color}40` : 'none',
          borderBottom: pos.bottom !== undefined ? `2px solid ${color}40` : 'none',
          borderLeft: pos.left !== undefined ? `2px solid ${color}40` : 'none',
          borderRight: pos.right !== undefined ? `2px solid ${color}40` : 'none',
          borderRadius: pos.top !== undefined && pos.left !== undefined ? '16px 0 0 0' :
                       pos.top !== undefined && pos.right !== undefined ? '0 16px 0 0' :
                       pos.bottom !== undefined && pos.left !== undefined ? '0 0 0 16px' : '0 0 16px 0',
        }} />
      ))}
    </>
  );

  // ════════════════════════════════════
  // VIEW_CARD: Kiroshi Optics peek
  // ════════════════════════════════════
  if (type === 'VIEW_CARD') {
    const legendIdx = parseInt(options[0]);
    const p = getPlayerState(gameState, myPlayer);
    const legend = p.legends[legendIdx];
    const cSet = legend ? getCardSet(legend.card.id) : 'alpha';

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={overlayStyle}>
        <Scanlines />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            padding: '28px 24px', position: 'relative',
            background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
            border: '1px solid rgba(0,240,255,0.2)', borderRadius: 16,
            boxShadow: '0 0 60px rgba(0,240,255,0.1), 0 20px 60px rgba(0,0,0,0.8)',
          }}
        >
          <Corners color="#00f0ff" />
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
            style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'var(--font-refinery), sans-serif', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.2em',
              color: '#0a0a12', background: '#00f0ff',
              padding: '4px 18px', borderRadius: 4,
              boxShadow: '0 0 20px rgba(0,240,255,0.5)',
            }}
          >
            {t('effect.scan')}
          </motion.div>

          {legend && (
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ position: 'relative', width: 140, height: 196, borderRadius: 8, overflow: 'hidden', perspective: 600 }}
            >
              <div style={{
                position: 'absolute', inset: -15,
                background: 'radial-gradient(ellipse, rgba(0,240,255,0.2) 0%, transparent 70%)',
                filter: 'blur(12px)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: 8, overflow: 'hidden',
                border: '2px solid rgba(0,240,255,0.4)',
                boxShadow: '0 0 30px rgba(0,240,255,0.15)',
              }}>
                <Image src={`/images/cards/${cSet}/${legend.card.id}.webp`} alt={locale === 'fr' ? legend.card.name_fr : legend.card.name_en} fill style={{ objectFit: 'cover' }} sizes="140px" />
                <motion.div
                  animate={{ y: [-200, 200] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(0,240,255,0.08) 50%, transparent 60%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </motion.div>
          )}

          <span style={{ fontFamily: 'var(--font-refinery), sans-serif', fontSize: 18, color: '#e0e8f0' }}>
            {legend ? (locale === 'fr' ? legend.card.name_fr : legend.card.name_en) : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 11, color: '#5a6a7a' }}>
            {t('effect.identityRevealed')}
          </span>

          <motion.button
            whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(0,240,255,0.3)' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(pendingAction.id, [options[0]])}
            style={{
              fontFamily: 'var(--font-refinery), sans-serif', fontSize: 13,
              color: '#00f0ff', background: 'rgba(0,240,255,0.08)',
              border: '1px solid rgba(0,240,255,0.3)', borderRadius: 8,
              padding: '10px 32px', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.15em',
            }}
          >
            {t('effect.dataLogged')}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // ════════════════════════════════════
  // CHOOSE_CARD: Card grid selection
  // ════════════════════════════════════
  if (type === 'CHOOSE_CARD') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={overlayStyle}>
        <Scanlines />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 24 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            padding: '28px 20px 20px', position: 'relative',
            background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
            border: '1px solid rgba(252,238,9,0.15)', borderRadius: 16,
            maxWidth: 520, width: '94%', maxHeight: '82vh', overflow: 'auto',
            boxShadow: '0 0 60px rgba(252,238,9,0.06), 0 20px 60px rgba(0,0,0,0.8)',
          }}
        >
          <Corners color="#fcee09" />
          <CardHeader color="#fcee09" badge={t('effect.select')} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
            {options.map((option, i) => {
              if (option === 'decline') {
                return (
                  <motion.button
                    key="decline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(pendingAction.id, ['decline'])}
                    style={{
                      fontFamily: 'var(--font-blender), sans-serif',
                      fontSize: 12, fontWeight: 700, color: '#5a5a6a',
                      background: 'transparent', border: '1px solid #2a2a3a',
                      borderRadius: 6, padding: '8px 20px', cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('effect.skip')}
                  </motion.button>
                );
              }

              const cardId = optionCardIds?.[i] || option;
              const label = optionLabels?.[i] || option;
              const isSelected = selected.includes(option);
              const cSet = getCardSet(cardId);

              return (
                <motion.div
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSelection(option)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <div style={{
                    position: 'relative', width: 76, height: 106, borderRadius: 6, overflow: 'hidden',
                    border: isSelected ? '2px solid #ffd700' : '1px solid #2a2a3a',
                    boxShadow: isSelected ? '0 0 16px rgba(255,215,0,0.4)' : '0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s',
                  }}>
                    <Image src={`/images/cards/${cSet}/${cardId}.webp`} alt={label} fill style={{ objectFit: 'cover' }} sizes="76px" />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(255,215,0,0.1)',
                        border: '2px solid rgba(255,215,0,0.6)',
                        borderRadius: 4,
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-blender), sans-serif',
                    fontSize: 9, color: isSelected ? '#ffd700' : '#6a7a8a',
                    textAlign: 'center', maxWidth: 76,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {maxSelections > 1 && (
            <motion.button
              whileHover={canConfirm ? { scale: 1.05, boxShadow: '0 0 16px rgba(34,197,94,0.3)' } : undefined}
              whileTap={canConfirm ? { scale: 0.95 } : undefined}
              onClick={() => canConfirm && onSelect(pendingAction.id, selected)}
              style={{
                fontFamily: 'var(--font-refinery), sans-serif', fontSize: 13,
                color: canConfirm ? '#22c55e' : '#3a3a4a',
                background: canConfirm ? 'rgba(34,197,94,0.08)' : 'transparent',
                border: `1px solid ${canConfirm ? 'rgba(34,197,94,0.4)' : '#1e2030'}`,
                borderRadius: 8, padding: '8px 28px', cursor: canConfirm ? 'pointer' : 'default',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}
            >
              {t('effect.confirm')} ({selected.length}/{maxSelections})
            </motion.button>
          )}

          {pendingAction.isOptional && onDecline && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDecline(pendingAction.id)}
              style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 11, color: '#4a4a5a', background: 'transparent',
                border: '1px solid #1e2030', borderRadius: 6,
                padding: '6px 18px', cursor: 'pointer', textTransform: 'uppercase',
              }}
            >
              {t('effect.skip')}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // ════════════════════════════════════
  // SELECT_TARGET / SELECT_GIG: Interactive list
  // ════════════════════════════════════
  const accentColor = type === 'SELECT_GIG' ? '#fcee09' : '#00f0ff';
  const badge = type === 'SELECT_GIG' ? t('effect.targetGig') : t('effect.target');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={overlayStyle}>
      <Scanlines />
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 24 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          padding: '28px 24px 20px', position: 'relative',
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
          border: `1px solid ${accentColor}15`, borderRadius: 16,
          maxWidth: 460, width: '92%', maxHeight: '80vh', overflow: 'auto',
          boxShadow: `0 0 60px ${accentColor}08, 0 20px 60px rgba(0,0,0,0.8)`,
        }}
      >
        <Corners color={accentColor} />
        <CardHeader color={accentColor} badge={badge} />

        {/* Clickable option buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
          {options.map((option, i) => {
            const label = optionLabels?.[i] || option;
            return (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 400 }}
                whileHover={{ scale: 1.03, boxShadow: `0 0 18px ${accentColor}20`, borderColor: `${accentColor}60` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleSelection(option)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  background: `linear-gradient(90deg, ${accentColor}06 0%, transparent 100%)`,
                  border: `1px solid ${accentColor}20`,
                  borderRadius: 8, cursor: 'pointer', width: '100%',
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 13, fontWeight: 600, color: accentColor,
                  textAlign: 'left', transition: 'border-color 0.2s',
                }}
              >
                {/* Dot indicator */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: accentColor, boxShadow: `0 0 8px ${accentColor}60`,
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1 }}>{label}</span>
                {/* Arrow */}
                <span style={{ color: `${accentColor}60`, fontSize: 16 }}>&gt;</span>
              </motion.button>
            );
          })}
        </div>

        {pendingAction.isOptional && onDecline && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDecline(pendingAction.id)}
            style={{
              fontFamily: 'var(--font-blender), sans-serif',
              fontSize: 11, color: '#4a4a5a', background: 'transparent',
              border: '1px solid #1e2030', borderRadius: 6,
              padding: '6px 18px', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {t('effect.skip')}
          </motion.button>
        )}

        {/* Bottom accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            borderRadius: '0 0 16px 16px', transformOrigin: 'center',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
