'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/i18n/navigation';
import CyberBackground from '@/components/CyberBackground';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError('Invalid email or password');
    else window.location.href = '/';
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    paddingLeft: 18,
    paddingRight: 18,
    fontSize: 14,
    background: '#111119',
    border: '1px solid #1e2030',
    borderRadius: 6,
    color: '#e0e8f0',
    outline: 'none',
    fontFamily: 'BlenderPro, sans-serif',
    letterSpacing: '0.02em',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen" style={{ padding: '24px' }}>
        <motion.div
          style={{ width: '100%', maxWidth: 400 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1
              className="font-refinery"
              style={{
                fontSize: 36,
                letterSpacing: '0.12em',
                color: '#00f0ff',
                marginBottom: 8,
                textShadow: '0 0 20px rgba(0,240,255,0.15)',
              }}
            >
              {t('auth.signIn')}
            </h1>
            <p
              className="font-blender"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#7a8a9a',
              }}
            >
              {t('auth.accessAccount')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              style={inputStyle}
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2030'; }}
            />
            <input
              style={inputStyle}
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              onFocus={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2030'; }}
            />

            {error && (
              <div
                className="font-blender"
                style={{ fontSize: 12, textAlign: 'center', color: '#ff003c', padding: '8px 0' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,240,255,0.12)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(0,240,255,0.02))';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #1e2030, transparent)', margin: '28px 0' }} />

          {/* Discord Login */}
          <button
            className="font-blender"
            style={{
              width: '100%',
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '14px 0',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'rgba(88,101,242,0.06)',
              border: '1px solid #5865F2',
              color: '#5865F2',
              transition: 'all 0.2s ease',
            }}
            onClick={() => signIn('discord')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(88,101,242,0.14)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(88,101,242,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(88,101,242,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="14" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.2a58.9 58.9 0 0017.7 9a.2.2 0 00.3-.1 42.1 42.1 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.3 47.3 0 003.6 5.9.2.2 0 00.3.1A58.7 58.7 0 0070.4 45.7v-.2C72 30.1 68 16.7 60.2 5a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.9 7.2-6.4 7.2z" />
            </svg>
            {t('auth.signInDiscord')}
          </button>

          {/* Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            <Link href="/register">
              <span
                className="font-blender"
                style={{ fontSize: 12, cursor: 'pointer', color: '#7a8a9a', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#00f0ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
              >
                {t('auth.createAccount')}
              </span>
            </Link>
            <Link href="/forgot-password">
              <span
                className="font-blender"
                style={{ fontSize: 12, cursor: 'pointer', color: '#7a8a9a', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#00f0ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
              >
                {t('auth.forgotPassword')}
              </span>
            </Link>
          </div>

          {/* Back */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/">
              <span
                className="font-blender"
                style={{ fontSize: 11, cursor: 'pointer', color: '#3a3a4a', transition: 'color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a4a'; }}
              >
                {t('auth.backToMenu')}
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
