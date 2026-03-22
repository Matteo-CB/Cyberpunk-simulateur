'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const MODES = [
  { key: 'ai', href: '/play/ai', color: '#00f0ff', desc: 'playAiDesc' },
  { key: 'online', href: '/play/online', color: '#22c55e', desc: 'playOnlineDesc' },
];

export default function PlayPage() {
  const t = useTranslations('play');

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
        <motion.h1
          className="font-refinery tracking-wider"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: '#00f0ff',
            textShadow: '0 0 30px rgba(0,240,255,0.4)',
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            marginBottom: 6,
          }}
        >
          {t('title')}
        </motion.h1>

        <motion.p
          className="font-blender uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.15 }}
          style={{ color: '#6b7a8a', fontSize: 11, marginBottom: 36 }}
        >
          {t('subtitle')}
        </motion.p>

        {/* Mode buttons - vertical list, compact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, width: '100%' }}>
          {MODES.map((mode, i) => (
            <motion.div
              key={mode.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <Link href={mode.href} style={{ textDecoration: 'none' }}>
                <div
                  className="font-blender cursor-pointer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 22px',
                    borderRadius: 8,
                    background: '#111119',
                    border: '1px solid #1e2030',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${mode.color}60`;
                    e.currentTarget.style.background = '#1a1a25';
                    e.currentTarget.style.boxShadow = `0 0 16px ${mode.color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1e2030';
                    e.currentTarget.style.background = '#111119';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Color dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: mode.color, boxShadow: `0 0 8px ${mode.color}50`,
                    flexShrink: 0,
                  }} />

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: mode.color, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                      {t(mode.key)}
                    </div>
                    <div style={{ color: '#6b7a8a', fontSize: 12, lineHeight: 1.4 }}>
                      {t(mode.desc)}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Back */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 32 }}
        >
          <Link href="/">
            <span
              className="font-blender uppercase tracking-widest cursor-pointer"
              style={{ color: '#555', fontSize: 11, transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#888'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; }}
            >
              Back
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
