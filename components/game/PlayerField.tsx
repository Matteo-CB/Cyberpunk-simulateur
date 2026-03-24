'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { CardData } from '@/lib/data/types';
import type { UnitOnField } from '@/lib/engine/types';
import { calculateEffectivePower } from '@/lib/engine/utils';

interface PlayerFieldProps {
  units: UnitOnField[];
  isOwner: boolean;
  compact?: boolean;
  targetableIds?: string[];
  pendingTargetIds?: string[];
  spendableUnitIds?: string[];
  selectedId?: string;
  onSelectUnit?: (instanceId: string) => void;
  onSpendAbility?: (instanceId: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  red: '#ff003c',
  blue: '#00f0ff',
  green: '#22c55e',
  yellow: '#fcee09',
};

function getCardImagePath(card: CardData): string {
  return `/images/cards/${card.set}/${card.id}.webp`;
}

export default function PlayerField({
  units,
  isOwner,
  compact,
  targetableIds = [],
  pendingTargetIds,
  spendableUnitIds,
  selectedId,
  onSelectUnit,
  onSpendAbility,
}: PlayerFieldProps) {
  const t = useTranslations();
  const locale = useLocale();
  const cardW = compact ? 46 : 70;
  const cardH = compact ? 64 : 98;
  if (units.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: compact ? 70 : 110,
          padding: '8px 12px',
          border: '2px dashed #2a2a3a',
          borderRadius: 8,
          background: 'rgba(10, 10, 18, 0.3)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-blender), sans-serif',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#3a3a4a',
          }}
        >
          {isOwner ? t('game.deployUnits') : t('game.noRivalUnits')}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: compact ? 5 : 10,
        alignItems: 'flex-end',
        justifyContent: 'center',
        minHeight: compact ? 70 : 110,
        padding: compact ? '3px 4px' : '6px 8px',
      }}
    >
      {units.map((unit) => {
        const isTargetable = targetableIds.includes(unit.instanceId);
        const isPendingTarget = pendingTargetIds?.some((id) => id === unit.instanceId || id.includes(unit.instanceId));
        const isSpendable = spendableUnitIds?.includes(unit.instanceId);
        const isSelected = selectedId === unit.instanceId;
        const effectivePower = calculateEffectivePower(unit);
        const gearCount = unit.gear.length;
        const cardColor = COLOR_MAP[unit.card.color] || '#888';

        // Determine border style
        let borderColor = 'rgba(40, 40, 60, 0.6)';
        let boxShadowVal = 'none';

        if (isPendingTarget) {
          borderColor = '#ffd700';
        } else if (isSelected) {
          borderColor = '#ff003c';
          boxShadowVal = '0 0 10px rgba(255, 0, 60, 0.5)';
        } else if (isTargetable) {
          borderColor = '#00f0ff';
        } else if (unit.playedThisTurn) {
          borderColor = '#fcee09';
        } else if (!unit.isSpent && isOwner) {
          borderColor = '#22c55e';
          boxShadowVal = '0 0 4px rgba(34, 197, 94, 0.15)';
        }

        return (
          <motion.div
            key={unit.instanceId}
            style={{
              position: 'relative',
              width: cardW,
              cursor: onSelectUnit ? 'pointer' : 'default',
            }}
            whileHover={onSelectUnit ? { y: -4, scale: 1.04 } : undefined}
            onClick={() => onSelectUnit?.(unit.instanceId)}
          >
            {/* Card container */}
            <motion.div
              style={{
                position: 'relative',
                width: cardW,
                height: cardH,
                borderRadius: 6,
                overflow: 'hidden',
                border: `2px solid ${borderColor}`,
                boxShadow: boxShadowVal,
                opacity: unit.isSpent ? 0.45 : 1,
                transform: unit.isSpent ? 'rotate(90deg)' : 'none',
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease, opacity 0.3s ease',
              }}
              // Pulsing border for targetable/pending
              animate={
                isPendingTarget
                  ? {
                      boxShadow: [
                        '0 0 4px rgba(255, 215, 0, 0.3)',
                        '0 0 14px rgba(255, 215, 0, 0.7)',
                        '0 0 4px rgba(255, 215, 0, 0.3)',
                      ],
                    }
                  : isTargetable
                    ? {
                        boxShadow: [
                          '0 0 4px rgba(0, 240, 255, 0.3)',
                          '0 0 12px rgba(0, 240, 255, 0.7)',
                          '0 0 4px rgba(0, 240, 255, 0.3)',
                        ],
                      }
                    : unit.playedThisTurn
                      ? {
                          boxShadow: [
                            '0 0 4px rgba(252, 238, 9, 0.2)',
                            '0 0 10px rgba(252, 238, 9, 0.5)',
                            '0 0 4px rgba(252, 238, 9, 0.2)',
                          ],
                        }
                      : undefined
              }
              transition={
                isPendingTarget || isTargetable || unit.playedThisTurn
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              <Image
                src={getCardImagePath(unit.card)}
                alt={locale === 'fr' ? unit.card.name_fr : unit.card.name_en}
                fill
                style={{ objectFit: 'cover' }}
                sizes={`${cardW}px`}
              />

              {/* "DEPLOYED" overlay for units played this turn */}
              {unit.playedThisTurn && !unit.isSpent && (
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontFamily: 'var(--font-blender), sans-serif',
                    fontSize: 7,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#fcee09',
                    background: 'rgba(0, 0, 0, 0.65)',
                    padding: '1px 0',
                  }}
                >
                  {t('game.deployed')}
                </div>
              )}

              {/* Power badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid ${cardColor}`,
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: cardColor,
                  padding: '0 3px',
                  lineHeight: 1,
                }}
              >
                {effectivePower}
              </div>
            </motion.div>

            {/* Gear dots */}
            {gearCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: 'center',
                  marginTop: unit.isSpent ? 16 : 3,
                }}
              >
                {unit.gear.map((g, gi) => (
                  <div
                    key={gi}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: COLOR_MAP[g.color] || '#a855f7',
                      boxShadow: `0 0 3px ${COLOR_MAP[g.color] || '#a855f7'}`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Spend ability button */}
            {isSpendable && onSpendAbility && (
              <motion.button
                whileHover={{ scale: 1.1, boxShadow: '0 0 8px rgba(252,238,9,0.3)' }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSpendAbility(unit.instanceId);
                }}
                style={{
                  display: 'block',
                  margin: '3px auto 0',
                  fontFamily: 'var(--font-blender), sans-serif',
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#fcee09',
                  background: 'rgba(252,238,9,0.08)',
                  border: '1px solid rgba(252,238,9,0.3)',
                  borderRadius: 3,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                {t('game.spend')}
              </motion.button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
