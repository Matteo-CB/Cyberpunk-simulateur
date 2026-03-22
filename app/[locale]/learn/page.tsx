'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CardPreview from '@/components/cards/CardPreview';
import { Link } from '@/lib/i18n/navigation';
import { getAllCards } from '@/lib/data/cardLoader';
import type { CardData } from '@/lib/data/types';
import { quizQuestions, type QuizQuestion } from '@/lib/data/quizQuestions';
import Die3D from '@/components/game/Die3D';
import type { DieType } from '@/lib/engine/types';

const DIE_COLORS: Record<string, string> = {
  d4: '#ff003c', d6: '#fcee09', d8: '#22c55e', d10: '#00f0ff', d12: '#a855f7', d20: '#ffd700',
};
const COLOR_MAP: Record<string, string> = {
  red: '#ff003c', blue: '#00f0ff', green: '#22c55e', yellow: '#fcee09',
};
const TAB_COLORS = { rules: '#00f0ff', cards: '#fcee09', quiz: '#ff003c' };

const ALL_DIE_TYPES: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const DIE_MAX: Record<DieType, number> = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };

function getCardSet(id: string) {
  return id?.startsWith('b') ? 'spoiler' : id?.startsWith('n') ? 'promo' : 'alpha';
}

// ════════════════════════════════════════════════════════
// SHARED COMPONENTS (kept for Cards/Quiz tabs)
// ════════════════════════════════════════════════════════

function CardImg({ id, size = 70 }: { id: string; size?: number }) {
  return (
    <motion.div whileHover={{ scale: 1.08, y: -3 }} style={{
      position: 'relative', width: size, height: size * 1.4, borderRadius: 6,
      overflow: 'hidden', border: '1px solid rgba(0,240,255,0.2)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)', flexShrink: 0,
    }}>
      <Image src={`/images/cards/${getCardSet(id)}/${id}.webp`} alt="" fill style={{ objectFit: 'cover' }} sizes={`${size}px`} />
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// RULES TAB
// ════════════════════════════════════════════════════════

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 3, height: 22, background: color, boxShadow: `0 0 8px ${color}60` }} />
        <h3 className="font-refinery" style={{
          fontSize: 18, color, letterSpacing: '0.12em', textTransform: 'uppercase',
          textShadow: `0 0 16px ${color}25`, margin: 0,
        }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function P({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="font-blender" style={{ color: color || '#8a94a0', fontSize: 14, lineHeight: 1.9, margin: '0 0 8px' }}>
      {children}
    </p>
  );
}

function Cards({ ids, size = 60 }: { ids: string[]; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, margin: '14px 0', flexWrap: 'wrap' }}>
      {ids.map((id) => <CardImg key={id} id={id} size={size} />)}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, margin: '6px 0', background: 'linear-gradient(90deg, transparent, #1a1a2a, transparent)' }} />;
}

function RulesTab() {
  const t = useTranslations('rules');
  const [rollValues, setRollValues] = useState<Record<string, number>>({});

  const rollDie = (dt: DieType) => {
    const max = DIE_MAX[dt];
    setRollValues((prev) => ({ ...prev, [dt]: Math.floor(Math.random() * max) + 1 }));
  };

  return (
    <div style={{ margin: '0 auto' }}>

      <Section title={t('goalTitle')} color="#ffd700">
        <P>{t('goalDesc')}</P>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
          {ALL_DIE_TYPES.map((dt) => (
            <Die3D key={dt} type={dt} value={DIE_MAX[dt]} size={44} />
          ))}
        </div>
        <P color="#ff003c">{t('goalOvertime')}</P>
        <P color="#ff003c">{t('goalDeckout')}</P>
      </Section>

      <Section title={t('setupTitle')} color="#a855f7">
        <P>{t('setupLegends')}</P>
        <Cards ids={['a001', 'a005', 'a006']} size={48} />
        <P>{t('setupDeck')}</P>
        <P>{t('setupDice')}</P>
        <P color="#fcee09">{t('setupFirst')}</P>
        <P>{t('setupMulligan')}</P>
      </Section>

      <Section title={t('readyTitle')} color="#00f0ff">
        <P color="#ffd700">{t('readyWin')}</P>
        <P>{t('readyDraw')}</P>
        <P>{t('readyGig')}</P>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0' }}>
          {ALL_DIE_TYPES.map((dt) => (
            <div key={dt} onClick={() => rollDie(dt)} style={{ cursor: 'pointer' }}>
              <Die3D type={dt} value={rollValues[dt]} size={44} interactive onClick={() => rollDie(dt)} />
            </div>
          ))}
        </div>
        <P color="#5a6a7a">Click a die to roll it</P>
        <P>{t('readyReady')}</P>
      </Section>

      <Section title={t('playTitle')} color="#22c55e">
        <P color="#6a7a8a">{t('playDesc')}</P>
        <Divider />
        <P color="#fcee09">{t('playSell')}</P>
        <P color="#ffd700">{t('playCall')}</P>
        <Cards ids={['a007', 'a019', 'a021']} size={52} />
        <P color="#22c55e">{t('playUnit')}</P>
        <P color="#00f0ff">{t('playGear')}</P>
        <P color="#a855f7">{t('playProgram')}</P>
        <P color="#ff003c">{t('playGoSolo')}</P>
        <Cards ids={['a003', 'a004']} size={48} />
        <P color="#5a6a7a">{t('playEnd')}</P>
      </Section>

      <Section title={t('attackTitle')} color="#ff003c">
        <P color="#6a7a8a">{t('attackDesc')}</P>
        <Divider />
        <P color="#ff003c">{t('attackFight')}</P>
        <P color="#fcee09">{t('attackSteal')}</P>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 14px' }}>
          <CardImg id="a016" size={44} />
          <P color="#22c55e">{t('attackBlocker')}</P>
        </div>
        <P color="#ffd700">{t('attackCallDef')}</P>
        <P color="#5a6a7a">{t('attackCantAttack')}</P>
        <P color="#5a6a7a">{t('attackEnd')}</P>
      </Section>

      <Section title={t('cardsTitle')} color="#a855f7">
        <div style={{ display: 'flex', gap: 14, margin: '0 0 18px', flexWrap: 'wrap' }}>
          {[
            { id: 'a003', label: 'Legend', c: '#ffd700' },
            { id: 'a007', label: 'Unit', c: '#ff003c' },
            { id: 'a019', label: 'Gear', c: '#00f0ff' },
            { id: 'a021', label: 'Program', c: '#a855f7' },
          ].map((x) => (
            <div key={x.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <CardImg id={x.id} size={55} />
              <span className="font-blender" style={{ fontSize: 9, color: x.c, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{x.label}</span>
            </div>
          ))}
        </div>
        <P color="#ffd700">{t('cardsLegend')}</P>
        <P color="#ff003c">{t('cardsUnit')}</P>
        <P color="#00f0ff">{t('cardsGear')}</P>
        <P color="#a855f7">{t('cardsProgram')}</P>
      </Section>

      <Section title={t('keywordsTitle')} color="#ff003c">
        <div style={{ display: 'flex', gap: 8, margin: '0 0 14px', flexWrap: 'wrap' }}>
          <CardImg id="a016" size={44} />
          <CardImg id="a004" size={44} />
          <CardImg id="a020" size={44} />
          <CardImg id="a025" size={44} />
        </div>
        <P color="#22c55e">{t('kwBlocker')}</P>
        <P color="#ff003c">{t('kwGoSolo')}</P>
        <Divider />
        <P color="#22c55e">{t('kwPlay')}</P>
        <P color="#ff003c">{t('kwAttack')}</P>
        <P color="#ffd700">{t('kwFlip')}</P>
        <P color="#00f0ff">{t('kwPassive')}</P>
      </Section>

      <Section title={t('eddiesTitle')} color="#fcee09">
        <P>{t('eddiesDesc')}</P>
        <P color="#fcee09">{t('eddiesSell')}</P>
        <P color="#fcee09">{t('eddiesSpend')}</P>
        <P color="#22c55e">{t('eddiesReady')}</P>
      </Section>

      <Section title={t('ramTitle')} color="#00f0ff">
        <P>{t('ramLegends')}</P>
        <P>{t('ramCards')}</P>
        <P color="#a855f7">{t('ramDesc')}</P>
        <P color="#00f0ff">{t('ramExample')}</P>
      </Section>

      <Section title={t('scTitle')} color="#ffd700">
        <P color="#ffd700">{t('scDesc')}</P>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0' }}>
          <CardImg id="a007" size={44} />
          <P color="#ffd700">{t('scExample')}</P>
        </div>
        <P color="#5a6a7a">{t('scGrow')}</P>
      </Section>

      <Section title={t('diceTitle')} color="#00f0ff">
        <P>{t('diceDesc')}</P>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0' }}>
          {ALL_DIE_TYPES.map((dt) => (
            <div key={dt} onClick={() => rollDie(dt)} style={{ cursor: 'pointer' }}>
              <Die3D type={dt} value={rollValues[dt]} size={52} interactive onClick={() => rollDie(dt)} />
            </div>
          ))}
        </div>
        <P color="#fcee09">{t('diceSizes')}</P>
        <P color="#ffd700">{t('diceWin')}</P>
      </Section>

    </div>
  );
}
// ════════════════════════════════════════════════════════
// CARDS TAB
// ════════════════════════════════════════════════════════

function CardsTab() {
  const tl = useTranslations('learn');
  const locale = useLocale();
  const allCards = useMemo(() => getAllCards(), []);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);

  const filtered = useMemo(() =>
    allCards.filter((c) =>
      (typeFilter === 'all' || c.card_type === typeFilter) &&
      (colorFilter === 'all' || c.color === colorFilter)
    ), [allCards, typeFilter, colorFilter]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'legend', 'unit', 'gear', 'program'].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className="font-blender cursor-pointer" style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 6, textTransform: 'uppercase',
              background: typeFilter === t ? '#00f0ff15' : 'transparent',
              border: `1px solid ${typeFilter === t ? '#00f0ff40' : '#1e2030'}`,
              color: typeFilter === t ? '#00f0ff' : '#5a6a7a',
            }}>
              {t === 'all' ? tl('filterAll') : t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'red', 'blue', 'green', 'yellow'].map((c) => (
            <button key={c} onClick={() => setColorFilter(c)} className="font-blender cursor-pointer" style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 6, textTransform: 'uppercase',
              background: colorFilter === c ? `${COLOR_MAP[c] || '#00f0ff'}15` : 'transparent',
              border: `1px solid ${colorFilter === c ? `${COLOR_MAP[c] || '#00f0ff'}40` : '#1e2030'}`,
              color: colorFilter === c ? (COLOR_MAP[c] || '#00f0ff') : '#5a6a7a',
            }}>
              {c === 'all' ? tl('filterAll') : c}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
        {filtered.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: 1.06, y: -4 }}
            onClick={() => setPreviewCard(card)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div style={{
              position: 'relative', width: 80, height: 112, borderRadius: 6, overflow: 'hidden',
              border: `1px solid ${COLOR_MAP[card.color] || '#333'}30`,
              boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
            }}>
              <Image src={`/images/cards/${card.set}/${card.id}.webp`} alt={locale === 'fr' ? card.name_fr : card.name_en} fill style={{ objectFit: 'cover' }} sizes="80px" />
            </div>
            <span className="font-blender" style={{
              fontSize: 8, color: '#6a7a8a', textAlign: 'center',
              maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {locale === 'fr' ? card.name_fr : card.name_en}
            </span>
          </motion.div>
        ))}
      </div>

      <CardPreview card={previewCard} onClose={() => setPreviewCard(null)} />
    </div>
  );
}

// ════════════════════════════════════════════════════════
// QUIZ TAB
// ════════════════════════════════════════════════════════

const RANKS = [
  { min: 0, key: 'rankFlatlined', color: '#ff003c' },
  { min: 30, key: 'rankStreetKid', color: '#fcee09' },
  { min: 50, key: 'rankSolo', color: '#22c55e' },
  { min: 70, key: 'rankNetrunner', color: '#00f0ff' },
  { min: 90, key: 'rankLegend', color: '#ffd700' },
];

function QuizTab() {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const [phase, setPhase] = useState<'start' | 'playing' | 'results'>('start');
  const [category, setCategory] = useState<string>('all');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState<number | string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [numberInput, setNumberInput] = useState('');
  const [categoryScores, setCategoryScores] = useState<Record<string, { correct: number; total: number }>>({});

  const startQuiz = useCallback((cat: string) => {
    setCategory(cat);
    const pool = cat === 'all' ? quizQuestions : quizQuestions.filter((q) => q.category === cat);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(null);
    setShowExplanation(false);
    setNumberInput('');
    setCategoryScores({});
    setPhase('playing');
  }, []);

  const question = questions[currentIdx];
  const qText = question ? (locale === 'fr' ? question.question_fr : question.question_en) : '';
  const opts = question?.options_en ? (locale === 'fr' ? question.options_fr : question.options_en) : undefined;
  const explanation = question ? (locale === 'fr' ? question.explanation_fr : question.explanation_en) : '';
  const totalQ = questions.length;
  const pct = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;
  const rank = RANKS.slice().reverse().find((r) => pct >= r.min) || RANKS[0];

  const handleAnswer = useCallback((answer: number | string) => {
    if (answered !== null || !question) return;
    setAnswered(answer);
    setShowExplanation(true);

    const isCorrect = question.type === 'fill_number'
      ? String(answer).trim() === String(question.correctAnswer).trim()
      : answer === question.correctAnswer;

    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    setCategoryScores((prev) => {
      const cat = question.category;
      const existing = prev[cat] || { correct: 0, total: 0 };
      return { ...prev, [cat]: { correct: existing.correct + (isCorrect ? 1 : 0), total: existing.total + 1 } };
    });

    setTimeout(() => {
      if (currentIdx + 1 >= totalQ) {
        setPhase('results');
      } else {
        setCurrentIdx((i) => i + 1);
        setAnswered(null);
        setShowExplanation(false);
        setNumberInput('');
      }
    }, 2200);
  }, [answered, question, currentIdx, totalQ]);

  const isCorrectAnswer = (idx: number | string) => {
    if (!question) return false;
    if (question.type === 'fill_number') return String(idx).trim() === String(question.correctAnswer).trim();
    return idx === question.correctAnswer;
  };

  // START SCREEN
  if (phase === 'start') {
    const cats = [
      { key: 'all', label: t('allCategories'), color: '#00f0ff', count: quizQuestions.length },
      { key: 'rules', label: t('rulesCategory'), color: '#22c55e', count: quizQuestions.filter((q) => q.category === 'rules').length },
      { key: 'cards', label: t('cardsCategory'), color: '#fcee09', count: quizQuestions.filter((q) => q.category === 'cards').length },
      { key: 'strategy', label: t('strategyCategory'), color: '#a855f7', count: quizQuestions.filter((q) => q.category === 'strategy').length },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 0' }}>
        <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="font-refinery" style={{ fontSize: 32, color: '#ff003c', letterSpacing: '0.2em', textShadow: '0 0 30px rgba(255,0,60,0.3)' }}>
          {t('title')}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.1 }}
          className="font-blender" style={{ color: '#5a6a7a', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('selectCategory')}
        </motion.p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
          {cats.map((cat, i) => (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${cat.color}20` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startQuiz(cat.key)}
              className="cursor-pointer"
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                background: `linear-gradient(90deg, ${cat.color}08, transparent)`,
                border: `1px solid ${cat.color}25`, borderRadius: 10,
                fontFamily: 'var(--font-blender)', fontSize: 15, fontWeight: 700,
                color: cat.color, textTransform: 'uppercase', letterSpacing: '0.08em',
                textAlign: 'left', transition: 'border-color 0.2s',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, boxShadow: `0 0 8px ${cat.color}60` }} />
              <span style={{ flex: 1 }}>{cat.label}</span>
              <span style={{ fontSize: 11, color: `${cat.color}80` }}>{t('questionsCount', { count: cat.count })}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (phase === 'results') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '40px 0' }}>
        <motion.h2 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="font-refinery" style={{ fontSize: 28, color: '#ff003c', letterSpacing: '0.15em' }}>
          {t('results')}
        </motion.h2>

        {/* Rank */}
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          style={{
            padding: '16px 40px', borderRadius: 12,
            background: `${rank.color}10`, border: `2px solid ${rank.color}40`,
            boxShadow: `0 0 40px ${rank.color}15`,
          }}>
          <span className="font-refinery" style={{ fontSize: 24, color: rank.color, letterSpacing: '0.2em', textShadow: `0 0 20px ${rank.color}40` }}>
            {t(rank.key as any)}
          </span>
        </motion.div>

        {/* Score */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className="font-refinery" style={{ fontSize: 48, color: '#e0e8f0' }}>{pct}%</span>
          <span className="font-blender" style={{ fontSize: 14, color: '#5a6a7a' }}>{score}/{totalQ} {t('correct').toLowerCase()}</span>
          <span className="font-blender" style={{ fontSize: 12, color: '#4a4a5a' }}>{t('bestStreak')}: {bestStreak}</span>
        </motion.div>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ width: '100%', maxWidth: 360 }}>
          <p className="font-blender" style={{ color: '#5a6a7a', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
            {t('categoryBreakdown')}
          </p>
          {Object.entries(categoryScores).map(([cat, data]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e2030' }}>
              <span className="font-blender" style={{ color: '#8a94a0', fontSize: 13, textTransform: 'capitalize' }}>{t(cat as any)}</span>
              <span className="font-blender" style={{ color: '#e0e8f0', fontSize: 13, fontWeight: 700 }}>{data.correct}/{data.total}</span>
            </div>
          ))}
        </motion.div>

        {/* Play again */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,0,60,0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPhase('start')}
          className="font-refinery cursor-pointer"
          style={{
            fontSize: 15, color: '#ff003c', background: 'rgba(255,0,60,0.08)',
            border: '1px solid rgba(255,0,60,0.3)', borderRadius: 10,
            padding: '12px 40px', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 10,
          }}>
          {t('restart')}
        </motion.button>
      </div>
    );
  }

  // QUESTION SCREEN
  if (!question) return null;

  const correctIdx = question.correctAnswer;
  const getOptColor = (idx: number) => {
    if (answered === null) return '#00f0ff';
    if (idx === correctIdx) return '#22c55e';
    if (idx === answered) return '#ff003c';
    return '#3a3a4a';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '20px 0' }}>
      {/* Progress bar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="font-blender" style={{ color: '#5a6a7a', fontSize: 12, flexShrink: 0 }}>
          {t('question')} {currentIdx + 1} {t('of')} {totalQ}
        </span>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1e2030', overflow: 'hidden' }}>
          <motion.div animate={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
            style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #ff003c, #00f0ff)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <span className="font-blender" style={{ color: '#22c55e', fontSize: 12 }}>{score}</span>
          {streak > 1 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="font-blender"
              style={{ color: '#ffd700', fontSize: 11, background: '#ffd70015', padding: '1px 6px', borderRadius: 4 }}>
              {t('streak')}: {streak}
            </motion.span>
          )}
        </div>
      </div>

      {/* Category badge */}
      <span className="font-blender" style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: question.category === 'rules' ? '#22c55e' : question.category === 'cards' ? '#fcee09' : '#a855f7',
        padding: '2px 10px', borderRadius: 4,
        background: `${question.category === 'rules' ? '#22c55e' : question.category === 'cards' ? '#fcee09' : '#a855f7'}12`,
        border: `1px solid ${question.category === 'rules' ? '#22c55e' : question.category === 'cards' ? '#fcee09' : '#a855f7'}30`,
      }}>
        {question.category}
      </span>

      {/* Card image for image_identify */}
      {question.type === 'image_identify' && question.cardId && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'relative', width: 120, height: 168, borderRadius: 8, overflow: 'hidden',
            border: '2px solid rgba(0,240,255,0.3)', boxShadow: '0 0 30px rgba(0,240,255,0.1)',
          }}>
          <Image src={`/images/cards/${question.cardSet || getCardSet(question.cardId)}/${question.cardId}.webp`} alt="" fill style={{ objectFit: 'cover' }} sizes="120px" />
        </motion.div>
      )}

      {/* Question text */}
      <motion.p key={currentIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="font-blender" style={{ fontSize: 18, color: '#e0e8f0', textAlign: 'center', lineHeight: 1.6, maxWidth: 500 }}>
        {qText}
      </motion.p>

      {/* Options */}
      {question.type === 'fill_number' ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            disabled={answered !== null}
            className="font-blender"
            style={{
              width: 80, padding: '10px 16px', fontSize: 20, textAlign: 'center',
              background: '#111119', border: '1px solid #00f0ff30', borderRadius: 8,
              color: '#e0e8f0', outline: 'none',
            }}
          />
          <motion.button
            whileHover={answered === null ? { scale: 1.05 } : undefined}
            whileTap={answered === null ? { scale: 0.95 } : undefined}
            onClick={() => answered === null && numberInput && handleAnswer(numberInput)}
            className="font-blender cursor-pointer"
            style={{
              fontSize: 13, fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase',
              background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.3)',
              borderRadius: 8, padding: '10px 24px',
              opacity: answered !== null || !numberInput ? 0.4 : 1,
            }}>
            {t('submit')}
          </motion.button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 440 }}>
          {(question.type === 'true_false'
            ? [{ label: t('true'), idx: 0 }, { label: t('false'), idx: 1 }]
            : (opts || []).map((o, i) => ({ label: o, idx: i }))
          ).map((opt, i) => {
            const color = getOptColor(opt.idx);
            const isAnswered = answered !== null;
            const isThis = answered === opt.idx;
            const isRight = opt.idx === correctIdx;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.06 }}
                whileHover={!isAnswered ? { scale: 1.02, boxShadow: `0 0 16px ${color}20` } : undefined}
                whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                onClick={() => handleAnswer(opt.idx)}
                disabled={isAnswered}
                className="cursor-pointer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                  background: isAnswered && isRight ? 'rgba(34,197,94,0.08)' : isAnswered && isThis && !isRight ? 'rgba(255,0,60,0.08)' : `${color}06`,
                  border: `1px solid ${isAnswered && isRight ? '#22c55e50' : isAnswered && isThis ? '#ff003c50' : `${color}20`}`,
                  borderRadius: 10, textAlign: 'left', width: '100%',
                  fontFamily: 'var(--font-blender)', fontSize: 14, color: isAnswered ? (isRight ? '#22c55e' : isThis ? '#ff003c' : '#3a3a4a') : '#c0c8d0',
                  transition: 'all 0.2s',
                  boxShadow: isAnswered && isRight ? '0 0 12px rgba(34,197,94,0.15)' : isAnswered && isThis && !isRight ? '0 0 12px rgba(255,0,60,0.15)' : 'none',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: `${color}12`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color,
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span>{opt.label}</span>
                {isAnswered && isRight && <span style={{ marginLeft: 'auto', fontSize: 12 }}>&#10003;</span>}
                {isAnswered && isThis && !isRight && <span style={{ marginLeft: 'auto', fontSize: 12 }}>&#10007;</span>}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              width: '100%', maxWidth: 440, padding: '12px 16px', borderRadius: 8,
              background: isCorrectAnswer(answered!) ? 'rgba(34,197,94,0.06)' : 'rgba(255,0,60,0.06)',
              border: `1px solid ${isCorrectAnswer(answered!) ? 'rgba(34,197,94,0.2)' : 'rgba(255,0,60,0.2)'}`,
            }}
          >
            <span className="font-blender" style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: isCorrectAnswer(answered!) ? '#22c55e' : '#ff003c', fontWeight: 700,
            }}>
              {isCorrectAnswer(answered!) ? t('correct') : t('wrong')}
            </span>
            <p className="font-blender" style={{ color: '#8a94a0', fontSize: 13, lineHeight: 1.6, margin: '6px 0 0' }}>
              {explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════

export default function LearnPage() {
  const tl = useTranslations('learn');
  const t = useTranslations('rules');
  const tc = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'rules' | 'cards' | 'quiz'>('rules');

  const tabs = [
    { key: 'rules' as const, label: tl('tabRules'), color: TAB_COLORS.rules },
    { key: 'cards' as const, label: tl('tabCards'), color: TAB_COLORS.cards },
    { key: 'quiz' as const, label: tl('tabQuiz'), color: TAB_COLORS.quiz },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="absolute top-4 right-5 z-50"><LanguageSwitcher /></div>

      <div className="relative z-10 flex flex-col min-h-screen" style={{ maxWidth: 920, padding: '40px 24px', width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, gap: 6 }}>
          <Link href="/">
            <span className="font-blender cursor-pointer" style={{ color: '#4a4a5a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00f0ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#4a4a5a'; }}>
              {tc('back')}
            </span>
          </Link>
          <h1 className="font-refinery" style={{
            color: '#00f0ff', fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '0.2em', textShadow: '0 0 30px rgba(0,240,255,0.4)',
          }}>
            {t('title')}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 28 }}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.key)}
              className="font-refinery cursor-pointer"
              style={{
                fontSize: 14, letterSpacing: '0.15em', padding: '10px 28px',
                borderRadius: '8px 8px 0 0',
                background: activeTab === tab.key ? `${tab.color}10` : 'transparent',
                border: `1px solid ${activeTab === tab.key ? `${tab.color}40` : '#1e2030'}`,
                borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '1px solid #1e2030',
                color: activeTab === tab.key ? tab.color : '#4a4a5a',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'rules' && <RulesTab />}
            {activeTab === 'cards' && <CardsTab />}
            {activeTab === 'quiz' && <QuizTab />}
          </motion.div>
        </AnimatePresence>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
