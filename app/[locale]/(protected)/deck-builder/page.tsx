'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CardFace from '@/components/cards/CardFace';
import CardPreview from '@/components/cards/CardPreview';
import { getAllCards } from '@/lib/data/cardLoader';
import { validateDeck } from '@/lib/engine/rules/DeckValidation';
import { calculateRAMLimits } from '@/lib/engine/rules/RAMValidation';
import type { CardData, CardType, CardColor } from '@/lib/data/types';
import { Link } from '@/lib/i18n/navigation';

const COLOR_MAP: Record<string, string> = {
  red: '#ff003c',
  blue: '#00f0ff',
  green: '#22c55e',
  yellow: '#fcee09',
};

export default function DeckBuilderPage() {
  const t = useTranslations('deckBuilder');
  const locale = useLocale() as 'en' | 'fr';
  const [selectedLegends, setSelectedLegends] = useState<CardData[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [deckName, setDeckName] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [colorFilter, setColorFilter] = useState<CardColor | 'all'>('all');
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);

  const allCards = useMemo(() => getAllCards(), []);
  const legends = useMemo(() => allCards.filter((c) => c.card_type === 'legend'), [allCards]);
  const nonLegends = useMemo(() => allCards.filter((c) => c.card_type !== 'legend'), [allCards]);

  const ramLimits = useMemo(() => calculateRAMLimits(selectedLegends), [selectedLegends]);

  const validation = useMemo(
    () => validateDeck(selectedCards, selectedLegends),
    [selectedCards, selectedLegends]
  );

  const filteredCards = useMemo(() => {
    return nonLegends.filter((card) => {
      if (typeFilter !== 'all' && card.card_type !== typeFilter) return false;
      if (colorFilter !== 'all' && card.color !== colorFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = locale === 'fr' ? card.name_fr : card.name_en;
        if (!name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [nonLegends, typeFilter, colorFilter, search, locale]);

  const addCard = (card: CardData) => {
    if (card.card_type === 'legend') {
      if (selectedLegends.length < 3 && !selectedLegends.some((l) => l.name_en === card.name_en)) {
        setSelectedLegends([...selectedLegends, card]);
      }
    } else {
      const count = selectedCards.filter((c) => c.id === card.id).length;
      if (count < 3 && selectedCards.length < 50) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const removeCard = (index: number, isLegend: boolean) => {
    if (isLegend) {
      setSelectedLegends(selectedLegends.filter((_, i) => i !== index));
    } else {
      setSelectedCards(selectedCards.filter((_, i) => i !== index));
    }
  };

  const saveDeck = async () => {
    if (!validation.valid || !deckName) return;
    await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: deckName,
        cardIds: selectedCards.map((c) => c.id),
        legendIds: selectedLegends.map((l) => l.id),
      }),
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="absolute top-4 right-5 z-50"><LanguageSwitcher /></div>

      <div className="relative z-10 flex min-h-screen" style={{ maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {/* Left Panel: Card Pool */}
        <div
          className="flex flex-col"
          style={{
            width: '55%',
            padding: '32px 28px',
            borderRight: '1px solid #1e2030',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center"
            style={{
              marginBottom: 24,
              padding: '20px 24px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
              gap: 20,
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
                }}
              >
                Back
              </span>
            </Link>
            <h1
              className="font-refinery tracking-wider"
              style={{ color: '#00f0ff', fontSize: 28, letterSpacing: 3 }}
            >
              {t('title')}
            </h1>
          </div>

          {/* Filters */}
          <div
            className="flex flex-wrap items-center"
            style={{
              marginBottom: 20,
              padding: '16px 20px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
              gap: 10,
            }}
          >
            <input
              className="font-blender outline-none"
              style={{
                background: '#0a0a12',
                border: '1px solid #1e2030',
                color: '#e0e8f0',
                width: 180,
                fontSize: 13,
                padding: '8px 14px',
                borderRadius: 6,
              }}
              placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ width: 1, height: 28, background: '#1e2030' }} />
            {(['all', 'unit', 'gear', 'program'] as const).map((type) => (
              <button
                key={type}
                className="font-blender uppercase tracking-wider cursor-pointer"
                style={{
                  background: typeFilter === type ? '#1a1a25' : '#0a0a12',
                  border: `1px solid ${typeFilter === type ? '#00f0ff' : '#1e2030'}`,
                  color: typeFilter === type ? '#00f0ff' : '#7a8a9a',
                  fontSize: 11,
                  padding: '7px 14px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
            <div style={{ width: 1, height: 28, background: '#1e2030' }} />
            {(['all', 'red', 'blue', 'green', 'yellow'] as const).map((color) => (
              <button
                key={color}
                className="font-blender uppercase tracking-wider cursor-pointer"
                style={{
                  background: colorFilter === color ? '#1a1a25' : '#0a0a12',
                  border: `1px solid ${colorFilter === color ? (COLOR_MAP[color] || '#00f0ff') : '#1e2030'}`,
                  color: colorFilter === color ? (COLOR_MAP[color] || '#00f0ff') : '#7a8a9a',
                  fontSize: 11,
                  padding: '7px 14px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onClick={() => setColorFilter(color)}
              >
                {color}
              </button>
            ))}
          </div>

          {/* Legends to pick */}
          <div
            style={{
              marginBottom: 20,
              padding: '20px 24px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
            }}
          >
            <div
              className="font-blender uppercase tracking-wider"
              style={{ color: '#7a8a9a', fontSize: 12, marginBottom: 16 }}
            >
              Available Legends ({selectedLegends.length}/3 selected)
            </div>
            <div className="flex flex-wrap" style={{ gap: 12 }}>
              {legends.map((card) => {
                const selected = selectedLegends.some((l) => l.id === card.id);
                const nameUsed = selectedLegends.some((l) => l.name_en === card.name_en && l.id !== card.id);
                return (
                  <div
                    key={card.id}
                    className="cursor-pointer"
                    style={{
                      opacity: nameUsed ? 0.3 : 1,
                      padding: 4,
                      borderRadius: 8,
                      border: selected ? '2px solid #00f0ff' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => !selected && !nameUsed && addCard(card)}
                  >
                    <CardFace card={card} size="sm" showGlow={selected} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card pool */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: '20px 24px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 14,
              }}
            >
              {filteredCards.map((card) => {
                const count = selectedCards.filter((c) => c.id === card.id).length;
                const canAdd = count < 3 && selectedCards.length < 50 && card.ram <= (ramLimits[card.color] || 0);
                return (
                  <div
                    key={card.id}
                    className="relative cursor-pointer"
                    style={{
                      opacity: canAdd ? 1 : 0.35,
                      padding: 4,
                      borderRadius: 8,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => canAdd && addCard(card)}
                    onContextMenu={(e) => { e.preventDefault(); setPreviewCard(card); }}
                    onMouseEnter={(e) => { if (canAdd) e.currentTarget.style.background = '#1a1a25'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <CardFace card={card} size="sm" />
                    {count > 0 && (
                      <div
                        className="absolute flex items-center justify-center font-blender font-bold"
                        style={{
                          top: -2,
                          right: -2,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#00f0ff',
                          color: '#0a0a12',
                          fontSize: 11,
                        }}
                      >
                        {count}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Current Deck */}
        <div
          className="flex flex-col"
          style={{ width: '45%', padding: '32px 28px' }}
        >
          {/* Deck name + save */}
          <div
            className="flex items-center"
            style={{
              marginBottom: 24,
              padding: '16px 20px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
              gap: 12,
            }}
          >
            <input
              className="font-blender outline-none flex-1"
              style={{
                background: '#0a0a12',
                border: '1px solid #1e2030',
                color: '#e0e8f0',
                fontSize: 14,
                padding: '10px 16px',
                borderRadius: 8,
              }}
              placeholder={t('deckName')}
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
            <button
              className="font-blender uppercase tracking-wider cursor-pointer"
              style={{
                background: validation.valid && deckName ? '#111119' : '#0a0a12',
                border: `1px solid ${validation.valid ? '#22c55e' : '#ff003c'}`,
                color: validation.valid ? '#22c55e' : '#ff003c',
                fontSize: 13,
                padding: '10px 24px',
                borderRadius: 8,
                opacity: !validation.valid || !deckName ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
              onClick={saveDeck}
              disabled={!validation.valid || !deckName}
            >
              {t('save')}
            </button>
          </div>

          {/* Selected Legends */}
          <div
            style={{
              marginBottom: 20,
              padding: '20px 24px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
            }}
          >
            <div
              className="font-blender uppercase tracking-wider"
              style={{ color: '#7a8a9a', fontSize: 12, marginBottom: 16 }}
            >
              Your Legends ({selectedLegends.length}/3)
            </div>
            <div className="flex" style={{ gap: 16 }}>
              {selectedLegends.map((l, i) => (
                <div
                  key={i}
                  className="relative cursor-pointer"
                  onClick={() => removeCard(i, true)}
                  style={{ padding: 4 }}
                >
                  <CardFace card={l} size="sm" showGlow />
                  <div
                    className="absolute flex items-center justify-center font-blender"
                    style={{
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#ff003c',
                      color: '#fff',
                      fontSize: 11,
                    }}
                  >
                    x
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - selectedLegends.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center font-blender"
                  style={{
                    width: 88,
                    height: 120,
                    border: '1px dashed #1e2030',
                    borderRadius: 8,
                    color: '#333',
                    fontSize: 11,
                  }}
                >
                  EMPTY
                </div>
              ))}
            </div>
          </div>

          {/* RAM Display */}
          <div
            className="flex items-center"
            style={{
              marginBottom: 20,
              padding: '16px 24px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
              gap: 24,
            }}
          >
            <span
              className="font-blender uppercase tracking-wider"
              style={{ color: '#7a8a9a', fontSize: 12 }}
            >
              RAM Limits
            </span>
            <div style={{ width: 1, height: 24, background: '#1e2030' }} />
            {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map((color) => (
              <div
                key={color}
                className="font-blender"
                style={{
                  color: COLOR_MAP[color],
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {color.toUpperCase()}: {ramLimits[color]}
              </div>
            ))}
          </div>

          {/* Main Deck */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: '20px 24px',
              background: '#111119',
              borderRadius: 10,
              border: '1px solid #1e2030',
            }}
          >
            <div
              className="font-blender uppercase tracking-wider"
              style={{ color: '#7a8a9a', fontSize: 12, marginBottom: 16 }}
            >
              Main Deck ({selectedCards.length}/40-50)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: 12,
              }}
            >
              {selectedCards.map((card, i) => (
                <div
                  key={`${card.id}-${i}`}
                  className="relative cursor-pointer"
                  onClick={() => removeCard(i, false)}
                  style={{
                    padding: 4,
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a25'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <CardFace card={card} size="sm" />
                  <div
                    className="absolute flex items-center justify-center font-blender"
                    style={{
                      top: -4,
                      right: -4,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#ff003c',
                      color: '#fff',
                      fontSize: 11,
                    }}
                  >
                    x
                  </div>
                </div>
              ))}
            </div>
            {selectedCards.length === 0 && (
              <div
                className="font-blender"
                style={{
                  color: '#333',
                  fontSize: 14,
                  textAlign: 'center',
                  padding: '48px 0',
                }}
              >
                {locale === 'fr' ? 'Cliquez sur les cartes pour les ajouter' : 'Click cards to add them'}
              </div>
            )}
          </div>

          {/* Validation */}
          {validation.errors.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: '16px 20px',
                borderRadius: 10,
                background: 'rgba(255, 0, 60, 0.06)',
                border: '1px solid rgba(255, 0, 60, 0.2)',
              }}
            >
              {validation.errors.map((err, i) => (
                <div
                  key={i}
                  className="font-blender"
                  style={{ color: '#ff003c', fontSize: 13, marginBottom: i < validation.errors.length - 1 ? 6 : 0 }}
                >
                  {err}
                </div>
              ))}
            </div>
          )}
          {validation.valid && selectedCards.length >= 40 && (
            <div
              className="font-blender"
              style={{
                marginTop: 16,
                padding: '16px 20px',
                borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontSize: 13,
              }}
            >
              {t('valid')}
            </div>
          )}
        </div>
      </div>

      <CardPreview card={previewCard} onClose={() => setPreviewCard(null)} />
    </div>
  );
}
