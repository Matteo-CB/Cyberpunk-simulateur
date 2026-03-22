'use client';

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
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={{
            display: 'flex',
            gap: 32,
            padding: 28,
            maxWidth: 780,
            width: '100%',
            margin: '0 16px',
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
            width: 280,
            height: 391,
            borderRadius: 12,
            overflow: 'hidden',
            border: `2px solid ${color}`,
            boxShadow: `0 0 40px ${color}30, 0 8px 32px rgba(0,0,0,0.5)`,
          }}>
            <Image
              src={imagePath}
              alt={name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="280px"
              priority
            />
          </div>

          {/* Card Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
          }}>
            {/* Name */}
            <h2 style={{
              fontFamily: 'var(--font-refinery), sans-serif',
              fontSize: 26,
              letterSpacing: '0.04em',
              color,
              margin: 0,
              lineHeight: 1.2,
            }}>
              {name}
            </h2>

            {/* Title */}
            {title && (
              <p style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 14,
                fontStyle: 'italic',
                color: '#7a8a9a',
                margin: 0,
                marginTop: 4,
              }}>
                {title}
              </p>
            )}

            {/* Gap */}
            <div style={{ height: 16 }} />

            {/* Gradient divider */}
            <div style={{
              height: 1,
              background: `linear-gradient(to right, ${color}, ${color}40, transparent)`,
            }} />

            {/* Gap */}
            <div style={{ height: 16 }} />

            {/* Stats line */}
            <div style={{
              fontFamily: 'var(--font-blender), sans-serif',
              fontSize: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 20px',
              lineHeight: 1.6,
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

            {/* Gap */}
            <div style={{ height: 14 }} />

            {/* Classifications */}
            {card.classifications.length > 0 && (
              <>
                <div style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 11,
                  color: '#5a6a7a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}>
                  {t('game.classifications')}
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}>
                  {card.classifications.map((cls) => (
                    <span
                      key={cls}
                      style={{
                        fontFamily: 'var(--font-blender), sans-serif',
                        fontSize: 12,
                        padding: '5px 12px',
                        borderRadius: 4,
                        background: `${color}18`,
                        border: `1px solid ${color}35`,
                        color,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {cls}
                    </span>
                  ))}
                </div>
                <div style={{ height: 14 }} />
              </>
            )}

            {/* Keywords */}
            {card.keywords.length > 0 && (
              <>
                <div style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 11,
                  color: '#5a6a7a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}>
                  {t('game.keywords')}
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}>
                  {card.keywords.map((kw) => (
                    <span
                      key={kw}
                      style={{
                        fontFamily: 'var(--font-blender), sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '5px 12px',
                        borderRadius: 4,
                        background: '#ff003c18',
                        border: '1px solid #ff003c35',
                        color: '#ff003c',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <div style={{ height: 14 }} />
              </>
            )}

            {/* Effects */}
            {card.effects.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {card.effects.map((effect, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: 'var(--font-blender), sans-serif',
                      fontSize: 13,
                      padding: 14,
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid #1e2030',
                      lineHeight: 1.7,
                    }}
                  >
                    <span style={{
                      fontWeight: 700,
                      color: '#ff003c',
                      marginRight: 8,
                      textTransform: 'uppercase',
                      fontSize: 12,
                      letterSpacing: '0.04em',
                    }}>
                      {effect.type}
                    </span>
                    <span style={{ color: '#c8d0da' }}>
                      {locale === 'fr' ? effect.description_fr : effect.description_en}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Spacer pushes sell tag to bottom */}
            <div style={{ flex: 1, minHeight: 14 }} />

            {/* Sell tag */}
            {card.sell_tag && (
              <div style={{
                fontFamily: 'var(--font-blender), sans-serif',
                fontSize: 11,
                color: '#fcee09',
                opacity: 0.8,
                letterSpacing: '0.03em',
              }}>
                {t('game.sellable')}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
