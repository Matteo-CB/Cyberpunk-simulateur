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
