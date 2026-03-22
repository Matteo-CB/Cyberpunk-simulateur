'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link } from '@/lib/i18n/navigation';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [animations, setAnimations] = useState(true);
  const [discordUser, setDiscordUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.animationsEnabled !== undefined) setAnimations(data.animationsEnabled);
        if (data.discordUsername) setDiscordUser(data.discordUsername);
      })
      .catch(() => {});
  }, []);

  const savePreferences = async () => {
    setSaving(true);
    await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animationsEnabled: animations }),
    });
    setSaving(false);
  };

  const sectionStyle: React.CSSProperties = {
    padding: 24,
    borderRadius: 8,
    background: '#111119',
    border: '1px solid #1e2030',
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 520, width: '100%', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <Link href="/">
            <span
              className="font-blender"
              style={{ fontSize: 11, cursor: 'pointer', color: '#3a3a4a', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a4a'; }}
            >
              Back
            </span>
          </Link>
          <h1
            className="font-refinery"
            style={{
              fontSize: 32,
              letterSpacing: '0.1em',
              color: '#00f0ff',
              textShadow: '0 0 20px rgba(0,240,255,0.15)',
            }}
          >
            {t('title')}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Animations */}
          <motion.div
            style={sectionStyle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0', marginBottom: 4 }}>
                  {t('animations')}
                </div>
                <div className="font-blender" style={{ fontSize: 11, color: '#7a8a9a' }}>
                  {t('animationsDesc')}
                </div>
              </div>
              <button
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  background: animations ? '#00f0ff' : '#2a2a3a',
                  border: 'none',
                  position: 'relative',
                  flexShrink: 0,
                }}
                onClick={() => setAnimations(!animations)}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: animations ? 25 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: '#ffffff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </motion.div>

          {/* Language */}
          <motion.div
            style={sectionStyle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0', marginBottom: 14 }}>
              {t('language')}
            </div>
            <LanguageSwitcher />
          </motion.div>

          {/* Discord */}
          <motion.div
            style={sectionStyle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0', marginBottom: 14 }}>
              {t('discord')}
            </div>
            {discordUser ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="font-blender" style={{ fontSize: 12, color: '#5865F2' }}>
                  {t('discordLinked')} {discordUser}
                </div>
                <button
                  className="font-blender"
                  style={{
                    fontSize: 11,
                    padding: '6px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,0,60,0.25)',
                    color: '#ff003c',
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={async () => {
                    await fetch('/api/user/unlink-discord', { method: 'POST' });
                    setDiscordUser(null);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,60,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {t('unlinkDiscord')}
                </button>
              </div>
            ) : (
              <a href="/api/user/link-discord">
                <button
                  className="font-blender"
                  style={{
                    fontSize: 12,
                    padding: '8px 20px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #5865F2',
                    color: '#5865F2',
                    background: 'rgba(88,101,242,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,101,242,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88,101,242,0.06)'; }}
                >
                  {t('linkDiscord')}
                </button>
              </a>
            )}
          </motion.div>

          {/* Save */}
          <button
            className="font-blender"
            style={{
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: '14px 0',
              borderRadius: 6,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02))',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              transition: 'all 0.2s ease',
              marginTop: 8,
            }}
            onClick={savePreferences}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,240,255,0.12)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02))';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
