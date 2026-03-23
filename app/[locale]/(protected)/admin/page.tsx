'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function AdminPage() {
  const t = useTranslations();
  const [stats, setStats] = useState({ users: 0, games: 0 });

  const ADMIN_LINKS = [
    { href: '/admin/cards', label: t('admin.cardManagement'), tag: 'CARDS', color: '#00f0ff' },
    { href: '/admin/settings', label: t('admin.siteSettings'), tag: 'CONFIG', color: '#fcee09' },
    { href: '/admin/suggestions', label: t('admin.suggestions'), tag: 'INBOX', color: '#22c55e' },
  ];

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setStats({ users: data.users, games: data.games }); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 1000, width: '100%', margin: '0 auto' }}
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
              {t('common.back')}
            </span>
          </Link>
          <h1
            className="font-refinery"
            style={{
              fontSize: 32,
              letterSpacing: '0.1em',
              color: '#ff003c',
              textShadow: '0 0 20px rgba(255,0,60,0.2)',
            }}
          >
            {t('admin.title')}
          </h1>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: t('admin.users'), value: stats.users, color: '#00f0ff' },
            { label: t('admin.games'), value: stats.games, color: '#22c55e' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{
                padding: 24,
                borderRadius: 8,
                textAlign: 'center',
                background: '#111119',
                border: `1px solid ${stat.color}30`,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div
                className="font-refinery"
                style={{ fontSize: 28, color: stat.color, marginBottom: 4 }}
              >
                {stat.value}
              </div>
              <div
                className="font-blender"
                style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7a8a9a' }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Admin Link Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {ADMIN_LINKS.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
            >
              <Link href={link.href}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    padding: 24,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: '#111119',
                    border: `1px solid ${link.color}30`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = link.color;
                    e.currentTarget.style.background = '#1a1a25';
                    e.currentTarget.style.boxShadow = `0 0 20px ${link.color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${link.color}30`;
                    e.currentTarget.style.background = '#111119';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span
                    className="font-refinery"
                    style={{ fontSize: 12, letterSpacing: '0.15em', color: `${link.color}80` }}
                  >
                    {link.tag}
                  </span>
                  <span
                    className="font-blender"
                    style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', color: link.color }}
                  >
                    {link.label}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <button
            className="font-blender"
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '10px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              border: '1px solid rgba(255,0,60,0.25)',
              color: '#ff003c',
              background: 'transparent',
              transition: 'all 0.2s ease',
            }}
            onClick={async () => { await fetch('/api/admin/maintenance', { method: 'POST' }); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,60,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,0,60,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,0,60,0.25)'; }}
          >
            {t('admin.maintenance')}
          </button>
          <button
            className="font-blender"
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '10px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              border: '1px solid rgba(88,101,242,0.25)',
              color: '#5865F2',
              background: 'transparent',
              transition: 'all 0.2s ease',
            }}
            onClick={async () => { await fetch('/api/admin/discord-sync', { method: 'POST' }); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,101,242,0.06)'; e.currentTarget.style.borderColor = 'rgba(88,101,242,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(88,101,242,0.25)'; }}
          >
            {t('admin.syncDiscord')}
          </button>
        </div>
      </div>
    </div>
  );
}
