'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import CardFace from '@/components/cards/CardFace';
import type { CardData } from '@/lib/data/types';

interface TrashPileProps {
  cards: CardData[];
  label?: string;
  compact?: boolean;
}

export default function TrashPile({ cards, label, compact }: TrashPileProps) {
  const t = useTranslations();
  const displayLabel = label ?? t('game.trash').toUpperCase();
  const [showModal, setShowModal] = useState(false);
  const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

  return (
    <>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: cards.length > 0 ? 'pointer' : 'default', transform: compact ? 'scale(0.7)' : undefined, transformOrigin: 'center center' }}
        onClick={() => cards.length > 0 && setShowModal(true)}
      >
        <div style={{ position: 'relative', width: 52, height: 72 }}>
          {cards.length === 0 ? (
            <div style={{
              width: 52, height: 72, borderRadius: 4,
              border: '1px dashed rgba(255,0,60,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-blender" style={{ fontSize: 9, color: '#333' }}>{t('game.empty')}</span>
            </div>
          ) : (
            <>
              {/* Show top card face */}
              <div style={{
                width: 52, height: 72, borderRadius: 4, overflow: 'hidden',
                border: '1px solid rgba(255,0,60,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                position: 'relative',
              }}>
                <Image
                  src={`/images/cards/${topCard!.set}/${topCard!.id}.webp`}
                  alt={topCard!.name_en}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="52px"
                />
              </div>
              {/* Count */}
              <div style={{
                position: 'absolute', bottom: -2, right: -6, zIndex: 10,
                background: '#080810', border: '1px solid rgba(255,0,60,0.3)',
                borderRadius: 10, padding: '1px 6px',
              }}>
                <span className="font-blender" style={{ fontSize: 10, fontWeight: 700, color: '#ff003c' }}>{cards.length}</span>
              </div>
            </>
          )}
        </div>
        <span className="font-blender" style={{ fontSize: 7, color: 'rgba(255,0,60,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{displayLabel}</span>
      </div>

      {/* Trash viewer modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 700, width: '100%', maxHeight: '80vh',
                padding: 24, margin: '0 24px',
                background: '#0a0a12', border: '1px solid rgba(255,0,60,0.2)',
                borderRadius: 12, overflow: 'auto',
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span className="font-refinery" style={{ fontSize: 20, color: '#ff003c', letterSpacing: '0.1em' }}>{t('game.trash').toUpperCase()}</span>
                <span className="font-blender" style={{ fontSize: 12, color: '#666' }}>{cards.length} {t('game.cards')}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[...cards].reverse().map((card, i) => (
                  <CardFace key={`${card.id}-${i}`} card={card} size="sm" />
                ))}
              </div>
              {cards.length === 0 && (
                <div className="font-blender" style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
                  {t('game.noCardsInTrash')}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
