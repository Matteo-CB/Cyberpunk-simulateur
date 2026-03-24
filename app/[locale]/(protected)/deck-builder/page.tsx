'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CardFace from '@/components/cards/CardFace';
import CardPreview from '@/components/cards/CardPreview';
import { getAllCards, getCardById } from '@/lib/data/cardLoader';
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
  const [savedDecks, setSavedDecks] = useState<{ id: string; name: string; cardIds: string[]; legendIds: string[] }[]>([]);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetch('/api/decks')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => { if (Array.isArray(data)) setSavedDecks(data); })
      .catch(() => {});
  }, []);

  const loadDeck = (deck: { id: string; name: string; cardIds: string[]; legendIds: string[] }) => {
    const loadedLegends = deck.legendIds.map((id) => getCardById(id)).filter((c): c is CardData => !!c);
    const loadedCards = deck.cardIds.map((id) => getCardById(id)).filter((c): c is CardData => !!c);
    setSelectedLegends(loadedLegends);
    setSelectedCards(loadedCards);
    setDeckName(deck.name);
    setEditingDeckId(deck.id);
  };

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
    const res = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: deckName,
        cardIds: selectedCards.map((c) => c.id),
        legendIds: selectedLegends.map((l) => l.id),
      }),
    });
    if (res.ok) {
      const deck = await res.json();
      setSavedDecks([...savedDecks, deck]);
      setEditingDeckId(deck.id);
    }
  };

  const clearDeck = () => {
    setSelectedLegends([]);
    setSelectedCards([]);
    setDeckName('');
    setEditingDeckId(null);
  };

  // Get reason why a card can't be added
  const getCardDisabledReason = (card: CardData): string | null => {
    const count = selectedCards.filter((c) => c.id === card.id).length;
    if (count >= 3) return t('maxCopies');
    if (selectedCards.length >= 50) return t('deckFull');
    if (card.ram > (ramLimits[card.color] || 0)) {
      if ((ramLimits[card.color] || 0) === 0) {
        return t('noRamSupport', { color: card.color.toUpperCase() });
      }
      return t('ramTooHigh', { need: card.ram, have: ramLimits[card.color] });
    }
    return null;
  };

  // Current step indicator
  const step = selectedLegends.length < 3 ? 1 : selectedCards.length < 40 ? 2 : 3;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="absolute top-4 right-5 z-50"><LanguageSwitcher /></div>

      <div className="relative z-10 flex min-h-screen" style={{ maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {/* Left Panel: Card Pool */}
        <div className="flex flex-col" style={{ width: '55%', padding: '32px 28px', borderRight: '1px solid #1e2030' }}>
          {/* Header */}
          <div className="flex items-center" style={{ marginBottom: 20, padding: '20px 24px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030', gap: 16 }}>
            <Link href="/">
              <span className="font-blender cursor-pointer" style={{ color: '#7a8a9a', fontSize: 13, padding: '6px 16px', borderRadius: 6, border: '1px solid #1e2030', background: '#0a0a12' }}>
                Back
              </span>
            </Link>
            <h1 className="font-refinery tracking-wider" style={{ color: '#00f0ff', fontSize: 28, letterSpacing: 3, flex: 1 }}>
              {t('title')}
            </h1>
            <button
              className="font-blender cursor-pointer"
              onClick={() => setShowHelp(!showHelp)}
              style={{ color: '#fcee09', fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid #fcee0930', background: '#fcee0908', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {showHelp ? t('hideRules') : t('showRules')}
            </button>
          </div>

          {/* Help / Rules panel */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: 16 }}
              >
                <div style={{ padding: '20px 24px', background: '#111119', borderRadius: 10, border: '1px solid #fcee0920' }}>
                  <div className="font-refinery" style={{ color: '#fcee09', fontSize: 16, letterSpacing: '0.1em', marginBottom: 12 }}>
                    {t('rulesTitle')}
                  </div>
                  <div className="font-blender" style={{ color: '#7a8a9a', fontSize: 12, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <span style={{ color: '#00f0ff', fontWeight: 700 }}>{t('rule1Title')}</span>
                      <span> {t('rule1Desc')}</span>
                    </div>
                    <div>
                      <span style={{ color: '#00f0ff', fontWeight: 700 }}>{t('rule2Title')}</span>
                      <span> {t('rule2Desc')}</span>
                    </div>
                    <div>
                      <span style={{ color: '#00f0ff', fontWeight: 700 }}>{t('rule3Title')}</span>
                      <span> {t('rule3Desc')}</span>
                    </div>
                    <div>
                      <span style={{ color: '#fcee09', fontWeight: 700 }}>{t('rule4Title')}</span>
                      <span> {t('rule4Desc')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator */}
          <div style={{ marginBottom: 16, padding: '12px 20px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030', display: 'flex', alignItems: 'center', gap: 16 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} className="font-blender" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: step > s ? '#22c55e15' : step === s ? '#00f0ff15' : '#0a0a12',
                  border: `1px solid ${step > s ? '#22c55e40' : step === s ? '#00f0ff40' : '#1e2030'}`,
                  color: step > s ? '#22c55e' : step === s ? '#00f0ff' : '#3a3a4a',
                }}>
                  {step > s ? '\u2713' : s}
                </div>
                <span style={{ fontSize: 11, color: step === s ? '#e0e8f0' : '#5a6a7a' }}>
                  {s === 1 ? t('step1') : s === 2 ? t('step2') : t('step3')}
                </span>
                {s < 3 && <div style={{ width: 20, height: 1, background: '#1e2030' }} />}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center" style={{ marginBottom: 16, padding: '14px 20px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030', gap: 8 }}>
            <input
              className="font-blender outline-none"
              style={{ background: '#0a0a12', border: '1px solid #1e2030', color: '#e0e8f0', width: 180, fontSize: 13, padding: '8px 14px', borderRadius: 6 }}
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ width: 1, height: 28, background: '#1e2030' }} />
            {(['all', 'unit', 'gear', 'program'] as const).map((type) => (
              <button key={type} className="font-blender uppercase tracking-wider cursor-pointer" style={{
                background: typeFilter === type ? '#1a1a25' : '#0a0a12',
                border: `1px solid ${typeFilter === type ? '#00f0ff' : '#1e2030'}`,
                color: typeFilter === type ? '#00f0ff' : '#7a8a9a',
                fontSize: 11, padding: '7px 14px', borderRadius: 6, transition: 'all 0.2s',
              }} onClick={() => setTypeFilter(type)}>
                {type === 'all' ? t('filterAll') : type}
              </button>
            ))}
            <div style={{ width: 1, height: 28, background: '#1e2030' }} />
            {(['all', 'red', 'blue', 'green', 'yellow'] as const).map((color) => (
              <button key={color} className="font-blender uppercase tracking-wider cursor-pointer" style={{
                background: colorFilter === color ? '#1a1a25' : '#0a0a12',
                border: `1px solid ${colorFilter === color ? (COLOR_MAP[color] || '#00f0ff') : '#1e2030'}`,
                color: colorFilter === color ? (COLOR_MAP[color] || '#00f0ff') : '#7a8a9a',
                fontSize: 11, padding: '7px 14px', borderRadius: 6, transition: 'all 0.2s',
              }} onClick={() => setColorFilter(color)}>
                {color === 'all' ? t('filterAll') : color}
              </button>
            ))}
          </div>

          {/* Legends to pick (Step 1) */}
          <div style={{ marginBottom: 16, padding: '20px 24px', background: '#111119', borderRadius: 10, border: `1px solid ${step === 1 ? '#00f0ff20' : '#1e2030'}` }}>
            <div className="font-blender uppercase tracking-wider" style={{ color: step === 1 ? '#00f0ff' : '#7a8a9a', fontSize: 12, marginBottom: 4 }}>
              {t('legendsTitle', { count: selectedLegends.length })}
            </div>
            <div className="font-blender" style={{ color: '#4a5a6a', fontSize: 11, marginBottom: 14 }}>
              {t('legendsHint')}
            </div>
            <div className="flex flex-wrap" style={{ gap: 12 }}>
              {legends.map((card) => {
                const selected = selectedLegends.some((l) => l.id === card.id);
                const nameUsed = selectedLegends.some((l) => l.name_en === card.name_en && l.id !== card.id);
                const full = selectedLegends.length >= 3;
                const disabled = (full && !selected) || nameUsed;
                return (
                  <div
                    key={card.id}
                    className="relative cursor-pointer"
                    title={nameUsed ? t('nameAlreadyUsed') : full && !selected ? t('legendsFull') : ''}
                    style={{
                      opacity: disabled ? 0.3 : 1,
                      padding: 4, borderRadius: 8,
                      border: selected ? '2px solid #00f0ff' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      if (selected) removeCard(selectedLegends.findIndex((l) => l.id === card.id), true);
                      else if (!disabled) addCard(card);
                    }}
                    onContextMenu={(e) => { e.preventDefault(); setPreviewCard(card); }}
                  >
                    <CardFace card={card} size="sm" showGlow={selected} />
                    {/* RAM badge */}
                    <div className="absolute font-blender" style={{
                      bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      fontSize: 9, padding: '1px 6px', borderRadius: 4,
                      background: `${COLOR_MAP[card.color]}20`, color: COLOR_MAP[card.color],
                      border: `1px solid ${COLOR_MAP[card.color]}40`,
                    }}>
                      RAM {card.ram}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card pool (Step 2) */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px', background: '#111119', borderRadius: 10, border: `1px solid ${step === 2 ? '#00f0ff20' : '#1e2030'}` }}>
            {selectedLegends.length < 3 && (
              <div className="font-blender" style={{ color: '#3a4a5a', fontSize: 12, textAlign: 'center', padding: '32px 0' }}>
                {t('selectLegendsFirst')}
              </div>
            )}
            {selectedLegends.length === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 14 }}>
                {filteredCards.map((card) => {
                  const count = selectedCards.filter((c) => c.id === card.id).length;
                  const disabledReason = getCardDisabledReason(card);
                  const canAdd = !disabledReason;
                  return (
                    <div
                      key={card.id}
                      className="relative cursor-pointer"
                      title={disabledReason || ''}
                      style={{ opacity: canAdd ? 1 : 0.35, padding: 4, borderRadius: 8, transition: 'all 0.2s' }}
                      onClick={() => canAdd && addCard(card)}
                      onContextMenu={(e) => { e.preventDefault(); setPreviewCard(card); }}
                      onMouseEnter={(e) => { if (canAdd) e.currentTarget.style.background = '#1a1a25'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <CardFace card={card} size="sm" />
                      {/* Count badge */}
                      {count > 0 && (
                        <div className="absolute flex items-center justify-center font-blender font-bold" style={{
                          top: -2, right: -2, width: 22, height: 22, borderRadius: '50%',
                          background: '#00f0ff', color: '#0a0a12', fontSize: 11,
                        }}>
                          {count}
                        </div>
                      )}
                      {/* RAM indicator on disabled cards */}
                      {!canAdd && disabledReason && disabledReason.includes('RAM') && (
                        <div className="absolute font-blender" style={{
                          bottom: 6, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 8, padding: '1px 5px', borderRadius: 3,
                          background: '#ff003c20', color: '#ff003c', border: '1px solid #ff003c40',
                          whiteSpace: 'nowrap',
                        }}>
                          RAM {card.ram}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Current Deck */}
        <div className="flex flex-col" style={{ width: '45%', padding: '32px 28px' }}>
          {/* Saved Decks */}
          {savedDecks.length > 0 && (
            <div style={{ marginBottom: 16, padding: '16px 20px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030' }}>
              <div className="font-blender uppercase tracking-wider" style={{ color: '#7a8a9a', fontSize: 12, marginBottom: 12 }}>
                {t('savedDecks')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {savedDecks.map((deck) => (
                  <button key={deck.id} className="font-blender cursor-pointer" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 8,
                    background: editingDeckId === deck.id ? '#1a1a25' : '#0a0a12',
                    border: `1px solid ${editingDeckId === deck.id ? '#00f0ff' : '#1e2030'}`,
                    color: editingDeckId === deck.id ? '#00f0ff' : '#e0e8f0',
                    fontSize: 13, textAlign: 'left' as const, width: '100%',
                  }} onClick={() => loadDeck(deck)}>
                    <span>{deck.name}</span>
                    <span style={{ color: '#7a8a9a', fontSize: 11 }}>{deck.cardIds.length} {t('cardsCount')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deck name + save */}
          <div className="flex items-center" style={{ marginBottom: 20, padding: '16px 20px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030', gap: 12 }}>
            <input
              className="font-blender outline-none flex-1"
              style={{ background: '#0a0a12', border: '1px solid #1e2030', color: '#e0e8f0', fontSize: 14, padding: '10px 16px', borderRadius: 8 }}
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
                fontSize: 13, padding: '10px 24px', borderRadius: 8,
                opacity: !validation.valid || !deckName ? 0.5 : 1,
              }}
              onClick={saveDeck}
              disabled={!validation.valid || !deckName}
            >
              {t('save')}
            </button>
            {(selectedLegends.length > 0 || selectedCards.length > 0) && (
              <button
                className="font-blender uppercase tracking-wider cursor-pointer"
                style={{
                  background: '#0a0a12', border: '1px solid #ff003c30',
                  color: '#ff003c', fontSize: 13, padding: '10px 18px', borderRadius: 8,
                }}
                onClick={clearDeck}
              >
                {t('clear')}
              </button>
            )}
          </div>

          {/* Selected Legends */}
          <div style={{ marginBottom: 16, padding: '20px 24px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030' }}>
            <div className="font-blender uppercase tracking-wider" style={{ color: '#7a8a9a', fontSize: 12, marginBottom: 14 }}>
              {t('yourLegends', { count: selectedLegends.length })}
            </div>
            <div className="flex" style={{ gap: 16 }}>
              {selectedLegends.map((l, i) => (
                <div key={i} className="relative cursor-pointer" onClick={() => removeCard(i, true)} onContextMenu={(e) => { e.preventDefault(); setPreviewCard(l); }} style={{ padding: 4 }}>
                  <CardFace card={l} size="sm" showGlow />
                  <div className="absolute flex items-center justify-center font-blender" style={{
                    top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                    background: '#ff003c', color: '#fff', fontSize: 11,
                  }}>x</div>
                </div>
              ))}
              {Array.from({ length: 3 - selectedLegends.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center justify-center font-blender" style={{
                  width: 88, height: 120, border: '1px dashed #1e2030', borderRadius: 8, color: '#333', fontSize: 11,
                }}>
                  {t('empty')}
                </div>
              ))}
            </div>
          </div>

          {/* RAM Display with explanation */}
          <div style={{ marginBottom: 16, padding: '16px 24px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030' }}>
            <div className="flex items-center" style={{ gap: 16, marginBottom: 8 }}>
              <span className="font-blender uppercase tracking-wider" style={{ color: '#7a8a9a', fontSize: 12 }}>
                {t('ramLimits')}
              </span>
              <div style={{ width: 1, height: 20, background: '#1e2030' }} />
              {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map((color) => (
                <div key={color} className="font-blender" style={{ color: COLOR_MAP[color], fontSize: 13, fontWeight: 600 }}>
                  {color.toUpperCase()}: {ramLimits[color]}
                </div>
              ))}
            </div>
            <div className="font-blender" style={{ color: '#3a4a5a', fontSize: 10, lineHeight: 1.5 }}>
              {t('ramExplain')}
            </div>
          </div>

          {/* Main Deck */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px', background: '#111119', borderRadius: 10, border: '1px solid #1e2030' }}>
            <div className="font-blender uppercase tracking-wider" style={{ color: '#7a8a9a', fontSize: 12, marginBottom: 16 }}>
              {t('mainDeck', { count: selectedCards.length })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12 }}>
              {selectedCards.map((card, i) => (
                <div key={`${card.id}-${i}`} className="relative cursor-pointer" onClick={() => removeCard(i, false)}
                  onContextMenu={(e) => { e.preventDefault(); setPreviewCard(card); }}
                  style={{ padding: 4, borderRadius: 8, transition: 'background 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a25'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <CardFace card={card} size="sm" />
                  <div className="absolute flex items-center justify-center font-blender" style={{
                    top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                    background: '#ff003c', color: '#fff', fontSize: 11,
                  }}>x</div>
                </div>
              ))}
            </div>
            {selectedCards.length === 0 && (
              <div className="font-blender" style={{ color: '#333', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                {selectedLegends.length < 3 ? t('selectLegendsFirst') : t('clickToAdd')}
              </div>
            )}
          </div>

          {/* Validation */}
          {validation.errors.length > 0 && (
            <div style={{ marginTop: 16, padding: '16px 20px', borderRadius: 10, background: 'rgba(255, 0, 60, 0.06)', border: '1px solid rgba(255, 0, 60, 0.2)' }}>
              {validation.errors.map((err, i) => (
                <div key={i} className="font-blender" style={{ color: '#ff003c', fontSize: 13, marginBottom: i < validation.errors.length - 1 ? 6 : 0 }}>
                  {err}
                </div>
              ))}
            </div>
          )}
          {validation.valid && selectedCards.length >= 40 && (
            <div className="font-blender" style={{
              marginTop: 16, padding: '16px 20px', borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)',
              color: '#22c55e', fontSize: 13,
            }}>
              {t('valid')}
            </div>
          )}
        </div>
      </div>

      <CardPreview card={previewCard} onClose={() => setPreviewCard(null)} />
    </div>
  );
}
