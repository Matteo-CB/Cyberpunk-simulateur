'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CardFace from '@/components/cards/CardFace';
import CardPreview from '@/components/cards/CardPreview';
import { getAllCards } from '@/lib/data/cardLoader';
import type { CardData, CardType, CardColor } from '@/lib/data/types';
import { Link } from '@/lib/i18n/navigation';

const TYPES: (CardType | 'all')[] = ['all', 'legend', 'unit', 'gear', 'program'];
const COLORS: (CardColor | 'all')[] = ['all', 'red', 'blue', 'green', 'yellow'];
const COLOR_MAP: Record<string, string> = {
  red: '#ff003c',
  blue: '#00f0ff',
  green: '#22c55e',
  yellow: '#fcee09',
  all: '#7a8a9a',
};

export default function CollectionPage() {
  const t = useTranslations('collection');
  const locale = useLocale() as 'en' | 'fr';
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [colorFilter, setColorFilter] = useState<CardColor | 'all'>('all');
  const [search, setSearch] = useState('');
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);

  const allCards = useMemo(() => getAllCards(), []);

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (typeFilter !== 'all' && card.card_type !== typeFilter) return false;
      if (colorFilter !== 'all' && card.color !== colorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = locale === 'fr' ? card.name_fr : card.name_en;
        const title = locale === 'fr' ? card.title_fr : card.title_en;
        if (!name.toLowerCase().includes(q) && !title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allCards, typeFilter, colorFilter, search, locale]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="absolute top-4 right-5 z-50"><LanguageSwitcher /></div>

      <div className="relative z-10 flex flex-col min-h-screen" style={{ padding: '40px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div
          className="flex items-center"
          style={{
            marginBottom: 32,
            padding: '24px 32px',
            background: '#111119',
            borderRadius: 12,
            border: '1px solid #1e2030',
            gap: 24,
          }}
        >
          <Link href="/">
            <span
              className="font-blender cursor-pointer"
              style={{
                color: '#7a8a9a',
                fontSize: 13,
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid #1e2030',
                background: '#0a0a12',
                transition: 'all 0.2s',
              }}
            >
              Back
            </span>
          </Link>
          <h1
            className="font-refinery tracking-wider"
            style={{ color: '#00f0ff', fontSize: 36, letterSpacing: 4 }}
          >
            COLLECTION
          </h1>
          <div style={{ flex: 1 }} />
          <span
            className="font-blender"
            style={{
              color: '#7a8a9a',
              fontSize: 14,
              padding: '6px 16px',
              background: '#0a0a12',
              borderRadius: 6,
              border: '1px solid #1e2030',
            }}
          >
            {filteredCards.length} / {allCards.length} cards
          </span>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap items-center"
          style={{
            marginBottom: 32,
            padding: '20px 28px',
            background: '#111119',
            borderRadius: 12,
            border: '1px solid #1e2030',
            gap: 16,
          }}
        >
          {/* Search */}
          <input
            className="font-blender outline-none"
            style={{
              background: '#0a0a12',
              border: '1px solid #1e2030',
              color: '#e0e8f0',
              width: 240,
              fontSize: 14,
              padding: '10px 18px',
              borderRadius: 8,
            }}
            placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: '#1e2030' }} />

          {/* Type filters */}
          <div className="flex" style={{ gap: 8 }}>
            {TYPES.map((type) => (
              <button
                key={type}
                className="font-blender uppercase tracking-wider cursor-pointer"
                style={{
                  background: typeFilter === type ? '#1a1a25' : '#0a0a12',
                  border: `1px solid ${typeFilter === type ? '#00f0ff' : '#1e2030'}`,
                  color: typeFilter === type ? '#00f0ff' : '#7a8a9a',
                  fontSize: 12,
                  padding: '8px 16px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 32, background: '#1e2030' }} />

          {/* Color filters */}
          <div className="flex" style={{ gap: 8 }}>
            {COLORS.map((color) => (
              <button
                key={color}
                className="font-blender uppercase tracking-wider cursor-pointer"
                style={{
                  background: colorFilter === color ? '#1a1a25' : '#0a0a12',
                  border: `1px solid ${colorFilter === color ? COLOR_MAP[color] : '#1e2030'}`,
                  color: colorFilter === color ? COLOR_MAP[color] : '#7a8a9a',
                  fontSize: 12,
                  padding: '8px 16px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onClick={() => setColorFilter(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 20,
            padding: '28px 32px',
            background: '#111119',
            borderRadius: 12,
            border: '1px solid #1e2030',
          }}
        >
          {filteredCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              className="cursor-pointer"
              onClick={() => setPreviewCard(card)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 8,
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a25'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <CardFace card={card} size="sm" showGlow={false} />
              <div
                className="font-blender text-center truncate"
                style={{
                  color: '#9aa3b0',
                  fontSize: 11,
                  marginTop: 8,
                  maxWidth: '100%',
                  lineHeight: 1.3,
                }}
              >
                {locale === 'fr' ? card.name_fr : card.name_en}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div
            className="font-blender"
            style={{
              color: '#444',
              fontSize: 16,
              textAlign: 'center',
              padding: '64px 0',
            }}
          >
            {locale === 'fr' ? 'Aucune carte trouvee' : 'No cards found'}
          </div>
        )}
      </div>

      <CardPreview card={previewCard} onClose={() => setPreviewCard(null)} />
    </div>
  );
}
