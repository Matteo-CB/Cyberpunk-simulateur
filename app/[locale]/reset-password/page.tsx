'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/lib/i18n/navigation';
import CyberBackground from '@/components/CyberBackground';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) setStatus('success');
    else { const data = await res.json(); setError(data.error || 'Failed'); setStatus('error'); }
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
              RESET PASSWORD
            </h1>
          </div>

          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <p
                className="font-blender"
                style={{ fontSize: 13, color: '#22c55e', marginBottom: 24, lineHeight: 1.7 }}
              >
                Password reset successfully!
              </p>
              <Link href="/login">
                <span
                  className="font-blender"
                  style={{ fontSize: 12, cursor: 'pointer', color: '#00f0ff', transition: 'opacity 0.2s' }}
                >
                  Go to Login
                </span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                style={inputStyle}
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2030'; }}
              />
              <input
                style={inputStyle}
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                onFocus={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2030'; }}
              />

              {error && (
                <div
                  className="font-blender"
                  style={{ fontSize: 12, textAlign: 'center', color: '#ff003c', padding: '4px 0' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
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
                Reset Password
              </button>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Link href="/login">
                  <span
                    className="font-blender"
                    style={{ fontSize: 12, cursor: 'pointer', color: '#7a8a9a', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#00f0ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
                  >
                    Back to Login
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
