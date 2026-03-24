'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { LegendSlot } from '@/lib/engine/types';
import type { CardData } from '@/lib/data/types';

interface LegendsAreaProps {
  legends: LegendSlot[];
  isOwner: boolean;
  canCall: boolean;
  onCall?: (index: number) => void;
  onGoSolo?: (index: number) => void;
  compact?: boolean;
}

function getCardImagePath(card: CardData): string {
  return `/images/cards/${card.set}/${card.id}.webp`;
}

const SLOT_W = 55;
const SLOT_H = 77;

export default function LegendsArea({
  legends,
  isOwner,
  canCall,
  onCall,
  onGoSolo,
  compact,
}: LegendsAreaProps) {
  const t = useTranslations();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        transform: compact ? 'scale(0.7)' : undefined,
        transformOrigin: 'center center',
      }}
    >
      {legends.map((legend, i) => {
        // Legend is deployed on the field -- empty slot
        if (legend.isOnField) {
          return (
            <div
              key={i}
              style={{
                width: SLOT_W,
                height: SLOT_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #1e2030',
                borderRadius: 5,
                background: 'rgba(10, 10, 18, 0.5)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 7,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#3a3a4a',
                }}
              >
                {t('game.onField')}
              </span>
            </div>
          );
        }

        const isCallable = !legend.isFaceUp && canCall && isOwner;
        const hasGoSolo =
          legend.isFaceUp &&
          !legend.isSpent &&
          legend.card.keywords.includes('Go Solo') &&
          isOwner;

        const handleClick = () => {
          if (isCallable) {
            onCall?.(i);
          } else if (hasGoSolo) {
            onGoSolo?.(i);
          }
        };

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <motion.div
              style={{
                position: 'relative',
                width: SLOT_W,
                height: SLOT_H,
                borderRadius: 5,
                overflow: 'hidden',
                cursor: isCallable || hasGoSolo ? 'pointer' : 'default',
                border: isCallable
                  ? '2px solid #ffd700'
                  : legend.isSpent
                    ? '1px solid #1e2030'
                    : '1px solid rgba(60, 60, 80, 0.5)',
              }}
              animate={
                isCallable
                  ? {
                      boxShadow: [
                        '0 0 4px rgba(255, 215, 0, 0.2)',
                        '0 0 12px rgba(255, 215, 0, 0.6)',
                        '0 0 4px rgba(255, 215, 0, 0.2)',
                      ],
                    }
                  : undefined
              }
              transition={
                isCallable
                  ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
              whileHover={
                isCallable || hasGoSolo ? { scale: 1.06, y: -2 } : undefined
              }
              onClick={handleClick}
            >
              {legend.isFaceUp ? (
                <Image
                  src={getCardImagePath(legend.card)}
                  alt={legend.card.name_en}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes={`${SLOT_W}px`}
                />
              ) : (
                <Image
                  src="/images/card-back.webp"
                  alt="Face-down legend"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes={`${SLOT_W}px`}
                />
              )}

              {/* Spent overlay */}
              {legend.isSpent && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-blender), sans-serif',
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: '#ff003c',
                    }}
                  >
                    {t('game.spent')}
                  </span>
                </div>
              )}
            </motion.div>

            {/* CALL label for callable legends */}
            {isCallable && (
              <motion.span
                style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#ffd700',
                  lineHeight: 1,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {t('game.call')}
              </motion.span>
            )}

            {/* GO SOLO label */}
            {hasGoSolo && (
              <motion.span
                style={{
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#00f0ff',
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.1 }}
              >
                {t('game.goSolo')}
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}
