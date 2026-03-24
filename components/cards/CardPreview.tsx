'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import type { CardData } from '@/lib/data/types';

const COLOR_MAP: Record<string, string> = {
  red: '#ff003c',
  blue: '#00f0ff',
  green: '#22c55e',
  yellow: '#fcee09',
};

const TYPE_KEYS: Record<string, string> = {
  legend: 'game.typeLegend',
  unit: 'game.typeUnit',
  gear: 'game.typeGear',
  program: 'game.typeProgram',
};

interface CardPreviewProps {
  card: CardData | null;
  onClose: () => void;
}

export default function CardPreview({ card, onClose }: CardPreviewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!card) return null;

  const color = COLOR_MAP[card.color] || '#00f0ff';
  const name = locale === 'fr' ? card.name_fr : card.name_en;
  const title = locale === 'fr' ? card.title_fr : card.title_en;
  const imagePath = `/images/cards/${card.set}/${card.id}.webp`;

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.88)',
          padding: mobile ? 12 : 0,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={{
            display: 'flex',
            flexDirection: mobile ? 'column' : 'row',
            gap: mobile ? 16 : 32,
            padding: mobile ? 16 : 28,
            maxWidth: mobile ? 360 : 780,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            alignItems: mobile ? 'center' : undefined,
          }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card Image */}
          <div style={{
            position: 'relative',
            flexShrink: 0,
            width: mobile ? 160 : 280,
            height: mobile ? 224 : 391,
            borderRadius: mobile ? 8 : 12,
            overflow: 'hidden',
            border: `2px solid ${color}`,
            boxShadow: `0 0 40px ${color}30, 0 8px 32px rgba(0,0,0,0.5)`,
          }}>
            <Image
              src={imagePath}
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              sizes={mobile ? '160px' : '280px'}
              priority
            />
          </div>

          {/* Card Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            alignItems: mobile ? 'center' : undefined,
            textAlign: mobile ? 'center' : undefined,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-refinery), sans-serif',
              fontSize: mobile ? 20 : 26,
              letterSpacing: '0.04em',
              color,
              margin: 0,
              lineHeight: 1.2,
            }}>
              {name}
            </h2>

            {title && (
              <p style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: mobile ? 12 : 14,
                fontStyle: 'italic',
                color: '#7a8a9a',
                margin: 0,
                marginTop: 4,
              }}>
                {title}
              </p>
            )}

            <div style={{ height: mobile ? 10 : 16 }} />
            <div style={{ height: 1, background: `linear-gradient(to right, ${color}, ${color}40, transparent)` }} />
            <div style={{ height: mobile ? 10 : 16 }} />

            {/* Stats line */}
            <div style={{
              fontFamily: 'var(--font-blender), sans-serif',
              fontSize: mobile ? 12 : 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: mobile ? '4px 12px' : '4px 20px',
              lineHeight: 1.6,
              justifyContent: mobile ? 'center' : undefined,
            }}>
              <span style={{ color: '#7a8a9a' }}>
                {t('game.type')}: <span style={{ color: '#e0e8f0', fontWeight: 600 }}>{t(TYPE_KEYS[card.card_type] || 'game.typeUnit')}</span>
              </span>
              <span style={{ color: '#7a8a9a' }}>
                {t('game.color')}: <span style={{ color, fontWeight: 600 }}>{card.color.toUpperCase()}</span>
              </span>
              {card.cost !== null && (
                <span style={{ color: '#7a8a9a' }}>
                  {t('game.cost')}: <span style={{ color: '#e0e8f0', fontWeight: 600 }}>{card.cost}</span>
                </span>
              )}
              {card.power !== null && (
                <span style={{ color: '#7a8a9a' }}>
                  {t('game.power')}: <span style={{ color: '#e0e8f0', fontWeight: 600 }}>{card.power}</span>
                </span>
              )}
              <span style={{ color: '#7a8a9a' }}>
                {t('game.ram')}: <span style={{ color, fontWeight: 600 }}>{card.ram}</span>
              </span>
            </div>

            <div style={{ height: mobile ? 8 : 14 }} />

            {/* Classifications */}
            {card.classifications.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 11, color: '#5a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {t('game.classifications')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: mobile ? 'center' : undefined }}>
                  {card.classifications.map((cls) => (
                    <span key={cls} style={{
                      fontFamily: 'var(--font-blender), sans-serif', fontSize: mobile ? 11 : 12,
                      padding: mobile ? '4px 10px' : '5px 12px', borderRadius: 4,
                      background: `${color}18`, border: `1px solid ${color}35`, color,
                    }}>
                      {cls}
                    </span>
                  ))}
                </div>
                <div style={{ height: mobile ? 8 : 14 }} />
              </>
            )}

            {/* Keywords */}
            {card.keywords.length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 11, color: '#5a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {t('game.keywords')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: mobile ? 'center' : undefined }}>
                  {card.keywords.map((kw) => (
                    <span key={kw} style={{
                      fontFamily: 'var(--font-blender), sans-serif', fontSize: mobile ? 11 : 12, fontWeight: 600,
                      padding: mobile ? '4px 10px' : '5px 12px', borderRadius: 4,
                      background: '#ff003c18', border: '1px solid #ff003c35', color: '#ff003c',
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
                <div style={{ height: mobile ? 8 : 14 }} />
              </>
            )}

            {/* Effects */}
            {card.effects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 6 : 10 }}>
                {card.effects.map((effect, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-blender), sans-serif',
                    fontSize: mobile ? 12 : 13,
                    padding: mobile ? 10 : 14,
                    borderRadius: 6,
                    border: '1px solid #1e2030',
                    lineHeight: 1.7,
                    textAlign: 'left',
                  }}>
                    <span style={{ fontWeight: 700, color: '#ff003c', marginRight: 8, textTransform: 'uppercase', fontSize: mobile ? 11 : 12, letterSpacing: '0.04em' }}>
                      {effect.type}
                    </span>
                    <span style={{ color: '#c8d0da' }}>
                      {locale === 'fr' ? effect.description_fr : effect.description_en}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ flex: 1, minHeight: mobile ? 8 : 14 }} />

            {card.sell_tag && (
              <div style={{ fontFamily: 'var(--font-blender), sans-serif', fontSize: 11, color: '#fcee09', opacity: 0.8 }}>
                {t('game.sellable')}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
