'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/lib/i18n/navigation';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const DIFFICULTY_KEYS = [
  { key: 'easy', color: '#22c55e', labelKey: 'game.easy', descKey: 'game.easyDesc' },
  { key: 'medium', color: '#fcee09', labelKey: 'game.medium', descKey: 'game.mediumDesc' },
  { key: 'hard', color: '#ff003c', labelKey: 'game.hard', descKey: 'game.hardDesc' },
  { key: 'impossible', color: '#a855f7', labelKey: 'game.impossible', descKey: 'game.impossibleDesc' },
];

export default function PlayAIPage() {
  const t = useTranslations();
  const [difficulty, setDifficulty] = useState<string>('medium');
  const router = useRouter();

  const handleStart = () => {
    sessionStorage.setItem(
      'gameConfig',
      JSON.stringify({ mode: 'ai', difficulty })
    );
    router.push('/game');
  };

  const selectedDiff = DIFFICULTY_KEYS.find((d) => d.key === difficulty);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div className="absolute z-50" style={{ top: 16, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen"
        style={{ padding: '48px 24px', maxWidth: 600, width: '100%', margin: '0 auto' }}
      >
        {/* Title */}
        <motion.h1
          className="font-refinery tracking-wider"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            color: '#00f0ff',
            textShadow: '0 0 40px rgba(0,240,255,0.35), 0 0 80px rgba(0,240,255,0.15)',
            fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
            marginBottom: 8,
          }}
        >
          {t('game.playVsAi')}
        </motion.h1>

        <motion.p
          className="font-blender uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.15 }}
          style={{ color: '#6b7a8a', fontSize: 11, marginBottom: 40 }}
        >
          {t('game.selectDifficulty')}
        </motion.p>

        {/* Difficulty Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, width: '100%', marginBottom: 40 }}>
          {DIFFICULTY_KEYS.map((d, i) => {
            const isSelected = difficulty === d.key;
            return (
              <motion.button
                key={d.key}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
                onClick={() => setDifficulty(d.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '20px 24px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left' as const,
                  background: isSelected ? '#14142a' : '#111119',
                  border: `1px solid ${isSelected ? d.color : '#1a1a2e'}`,
                  boxShadow: isSelected ? `0 0 20px ${d.color}18, inset 0 0 30px ${d.color}06` : 'none',
                  transition: 'all 0.25s',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = `${d.color}60`;
                    e.currentTarget.style.background = '#131322';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#1a1a2e';
                    e.currentTarget.style.background = '#111119';
                  }
                }}
              >
                {/* Radio Indicator */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? d.color : '#333'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isSelected ? d.color : 'transparent',
                      boxShadow: isSelected ? `0 0 10px ${d.color}` : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div
                    className="font-blender uppercase tracking-wider"
                    style={{
                      color: d.color,
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {t(d.labelKey)}
                  </div>
                  <div
                    className="font-blender"
                    style={{ color: '#6b7a8a', fontSize: 12, lineHeight: 1.5 }}
                  >
                    {t(d.descKey)}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Start Button */}
        <motion.button
          className="font-blender uppercase tracking-widest cursor-pointer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          onClick={handleStart}
          style={{
            padding: '16px 48px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #0d1b2a, #111119)',
            border: `1px solid ${selectedDiff?.color || '#00f0ff'}`,
            color: selectedDiff?.color || '#00f0ff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: `0 0 24px ${selectedDiff?.color || '#00f0ff'}15`,
            transition: 'all 0.25s',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1a1a30';
            e.currentTarget.style.boxShadow = `0 0 32px ${selectedDiff?.color || '#00f0ff'}25`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0d1b2a, #111119)';
            e.currentTarget.style.boxShadow = `0 0 24px ${selectedDiff?.color || '#00f0ff'}15`;
          }}
        >
          {t('game.startGame')}
        </motion.button>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: 40 }}
        >
          <Link href="/play">
            <span
              className="font-blender uppercase tracking-widest cursor-pointer"
              style={{ color: '#555', fontSize: 11, transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#888'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; }}
            >
              {t('common.back')}
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
