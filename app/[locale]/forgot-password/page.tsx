'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/i18n/navigation';
import CyberBackground from '@/components/CyberBackground';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
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

      <div className="relative z-10 flex items-center justify-center min-h-screen" style={{ padding: '24px', maxWidth: 440, width: '100%', margin: '0 auto' }}>
        <motion.div
          style={{ width: '100%', maxWidth: 400 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1
              className="font-refinery"
              style={{
                fontSize: 28,
                letterSpacing: '0.1em',
                color: '#00f0ff',
                textShadow: '0 0 20px rgba(0,240,255,0.15)',
              }}
            >
              {t('auth.forgotPassword')}
            </h1>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p
                className="font-blender"
                style={{ fontSize: 13, color: '#22c55e', marginBottom: 24, lineHeight: 1.7 }}
              >
                {t('auth.resetSent')}
              </p>
              <Link href="/login">
                <span
                  className="font-blender"
                  style={{ fontSize: 12, cursor: 'pointer', color: '#00f0ff', transition: 'opacity 0.2s' }}
                >
                  {t('auth.backToLogin')}
                </span>
              </Link>
            </div>
          ) : (
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
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Link href="/login">
                  <span
                    className="font-blender"
                    style={{ fontSize: 12, cursor: 'pointer', color: '#7a8a9a', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#00f0ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
                  >
                    {t('auth.backToLogin')}
                  </span>
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
