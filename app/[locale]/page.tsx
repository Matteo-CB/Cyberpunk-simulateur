'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import CyberBackground from '@/components/CyberBackground';
import HoloCard from '@/components/HoloCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link } from '@/lib/i18n/navigation';

const FEATURED_CARDS = [
  { id: 'a003', set: 'alpha', name: 'V - Corporate Exile' },
  { id: 'a004', set: 'alpha', name: 'Goro Takemura - Hands Unclean' },
  { id: 'a013', set: 'alpha', name: 'Jackie Welles - Ride Or Die Choom' },
  { id: 'a006', set: 'alpha', name: 'Viktor Vektor' },
  { id: 'a024', set: 'alpha', name: 'Sandevistan' },
  { id: 'b131', set: 'spoiler', name: 'Royce - Psycho on the Edge' },
  { id: 'b137', set: 'spoiler', name: 'Adam Smasher - Metal Over Meat' },
  { id: 'a022', set: 'alpha', name: 'Dying Night' },
  { id: 'a019', set: 'alpha', name: 'Mantis Blades' },
];

const BG_CARDS = [
  { id: 'a007', set: 'alpha', x: '5%', y: '10%', rotate: -12, scale: 0.7, opacity: 0.04 },
  { id: 'a010', set: 'alpha', x: '80%', y: '65%', rotate: 8, scale: 0.6, opacity: 0.035 },
  { id: 'a014', set: 'alpha', x: '60%', y: '5%', rotate: -5, scale: 0.5, opacity: 0.03 },
  { id: 'a018', set: 'alpha', x: '15%', y: '70%', rotate: 15, scale: 0.55, opacity: 0.03 },
];

const MENU_BUTTONS = [
  { key: 'play', href: '/play', primary: true },
  { key: 'collection', href: '/collection', primary: false },
  { key: 'deckBuilder', href: '/deck-builder', primary: false },
  { key: 'leaderboard', href: '/leaderboard', primary: false },
  { key: 'rules', href: '/learn', primary: false },
  { key: 'settings', href: '/settings', primary: false },
  { key: 'friends', href: '/friends', primary: false },
];

const ADMIN_USERNAMES = ['Kutxyt', 'admin', 'Daiki0'];

export default function HomePage() {
  const t = useTranslations('home');
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string; discordId?: string; discordUsername?: string } | null>(null);
  const [featuredCard, setFeaturedCard] = useState(FEATURED_CARDS[0]);

  useEffect(() => {
    setMounted(true);
    setFeaturedCard(FEATURED_CARDS[Math.floor(Math.random() * FEATURED_CARDS.length)]);
    fetch('/api/user/me').then((r) => {
      if (r.ok) return r.json();
      return null;
    }).then((data) => {
      if (data && data.username) setUser(data);
    }).catch(() => {});
  }, []);

  const isAdmin = user && ADMIN_USERNAMES.includes(user.username);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      {/* Background card decorations */}
      {BG_CARDS.map((card) => (
        <div
          key={card.id}
          className="absolute pointer-events-none"
          style={{
            left: card.x,
            top: card.y,
            transform: `rotate(${card.rotate}deg) scale(${card.scale})`,
            opacity: card.opacity,
            filter: 'blur(2px)',
            width: 200,
            height: 280,
          }}
        >
          <Image
            src={`/images/cards/${card.set}/${card.id}.webp`}
            alt=""
            width={200}
            height={280}
            style={{ borderRadius: 8, objectFit: 'cover' }}
          />
        </div>
      ))}

      {/* Language Switcher */}
      <div className="absolute z-50" style={{ top: 16, right: 20 }}>
        <LanguageSwitcher />
      </div>

      {/* Main content */}
      <div
        className="relative z-10 flex min-h-screen items-center justify-center"
        style={{ padding: '48px 32px' }}
      >
        <div className="flex w-full items-center lg:justify-between justify-center" style={{ maxWidth: 1200, gap: 0, flexWrap: 'wrap' }}>

          {/* Left column: Menu */}
          <div className="flex flex-col items-start" style={{ width: '100%', maxWidth: 440 }}>


            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ marginBottom: 8 }}
            >
              <h1 className="font-refinery tracking-wider leading-none" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}>
                {t('title').split('').map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.04 }}
                    style={{
                      color: '#00f0ff',
                      textShadow: '0 0 30px rgba(0,240,255,0.5), 0 0 60px rgba(0,240,255,0.2)',
                      display: 'inline-block',
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="font-blender uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{ fontSize: 'clamp(0.65rem, 1.8vw, 0.9rem)', letterSpacing: '0.25em', color: '#7a8a9a', marginBottom: 32 }}
            >
              {t('subtitle')}
            </motion.p>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              style={{ width: '100%', height: 1, marginBottom: 28, background: 'linear-gradient(to right, #00f0ff, rgba(255,0,60,0.5), transparent)', transformOrigin: 'left' }}
            />

            {/* Mobile card */}
            <motion.div
              className="flex lg:hidden items-center justify-center w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ marginBottom: 28 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 200, height: 280, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(0,240,255,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }}
                  animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <HoloCard src={`/images/cards/${featuredCard.set}/${featuredCard.id}.webp`} alt={featuredCard.name} width={180} height={251} />
              </div>
            </motion.div>

            {/* Navigation buttons */}
            <nav className="flex flex-col w-full" style={{ gap: 6, marginBottom: 20 }}>
              {MENU_BUTTONS.map((btn, i) => (
                <motion.div
                  key={btn.key}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <Link href={btn.href} style={{ textDecoration: 'none' }}>
                    <div
                      className="flex items-center w-full font-blender uppercase tracking-wider cursor-pointer"
                      style={{
                        height: 48,
                        paddingLeft: 24,
                        paddingRight: 24,
                        fontSize: 14,
                        borderRadius: 6,
                        background: btn.primary ? 'rgba(0,240,255,0.04)' : '#111119',
                        border: btn.primary ? '1px solid rgba(0,240,255,0.5)' : '1px solid #1e2030',
                        color: btn.primary ? '#00f0ff' : '#c0c8d0',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1a1a25';
                        e.currentTarget.style.borderColor = '#00f0ff80';
                        e.currentTarget.style.boxShadow = '0 0 16px rgba(0,240,255,0.08)';
                        e.currentTarget.style.color = '#00f0ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = btn.primary ? 'rgba(0,240,255,0.04)' : '#111119';
                        e.currentTarget.style.borderColor = btn.primary ? 'rgba(0,240,255,0.5)' : '#1e2030';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.color = btn.primary ? '#00f0ff' : '#c0c8d0';
                      }}
                    >
                      {t(btn.key)}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Separator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              style={{ width: '100%', height: 1, marginBottom: 14, background: 'linear-gradient(to right, #1e2030, transparent)' }}
            />

            {/* Account section */}
            <motion.div
              className="flex flex-col w-full"
              style={{ gap: 8, marginBottom: 12 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              {user ? (
                <>
                  {/* Row 1: Profile + Admin (if admin) */}
                  <div className="flex w-full" style={{ gap: 8 }}>
                    <Link href={`/profile/${user.username}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <div
                        className="flex items-center justify-center w-full font-blender uppercase tracking-widest cursor-pointer"
                        style={{ height: 42, fontSize: 11, borderRadius: 6, border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff', background: 'rgba(0,240,255,0.04)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00f0ff80'; e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'; e.currentTarget.style.background = 'rgba(0,240,255,0.04)'; }}
                      >
                        {t('profile')}
                      </div>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" style={{ flex: 1, textDecoration: 'none' }}>
                        <div
                          className="flex items-center justify-center w-full font-blender uppercase tracking-widest cursor-pointer"
                          style={{ height: 42, fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,0,60,0.3)', color: '#ff003c', background: 'rgba(255,0,60,0.04)', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff003c80'; e.currentTarget.style.background = 'rgba(255,0,60,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,0,60,0.3)'; e.currentTarget.style.background = 'rgba(255,0,60,0.04)'; }}
                        >
                          {t('adminPanel')}
                        </div>
                      </Link>
                    )}
                  </div>
                  {/* Row 2: Logout */}
                  <button
                    className="w-full font-blender uppercase tracking-widest cursor-pointer"
                    style={{ height: 42, fontSize: 11, borderRadius: 6, border: '1px solid #262630', color: '#5a5a6a', background: 'transparent', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff003c40'; e.currentTarget.style.color = '#ff003c'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#262630'; e.currentTarget.style.color = '#5a5a6a'; }}
                    onClick={() => { fetch('/api/auth/csrf').then(r => r.json()).then(({ csrfToken }) => { fetch('/api/auth/signout', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `csrfToken=${csrfToken}` }).then(() => { setUser(null); window.location.reload(); }); }).catch(() => { setUser(null); window.location.reload(); }); }}
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <div className="flex w-full" style={{ gap: 12 }}>
                  <Link href="/login" style={{ flex: 1, textDecoration: 'none' }}>
                    <div
                      className="flex items-center justify-center w-full font-blender uppercase tracking-widest cursor-pointer"
                      style={{ height: 42, fontSize: 11, borderRadius: 6, border: '1px solid #262630', color: '#7a8a9a', background: 'transparent', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; e.currentTarget.style.color = '#00f0ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#262630'; e.currentTarget.style.color = '#7a8a9a'; }}
                    >
                      {t('signIn')}
                    </div>
                  </Link>
                  <Link href="/register" style={{ flex: 1, textDecoration: 'none' }}>
                    <div
                      className="flex items-center justify-center w-full font-blender uppercase tracking-widest cursor-pointer"
                      style={{ height: 42, fontSize: 11, borderRadius: 6, border: '1px solid #262630', color: '#7a8a9a', background: 'transparent', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00f0ff40'; e.currentTarget.style.color = '#00f0ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#262630'; e.currentTarget.style.color = '#7a8a9a'; }}
                    >
                      {t('register')}
                    </div>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div
              className="font-blender w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              style={{ fontSize: 10, lineHeight: 1.8 }}
            >
              <div style={{ color: '#3a3a4a' }}>{t('footer')}</div>
              <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
                <Link href="/legal" style={{ color: '#33333a', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#7a8a9a'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#33333a'; }}
                >
                  Legal
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right column: Featured Card (desktop) */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ flexShrink: 0, marginLeft: 'auto', paddingLeft: 60 }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{ width: 340, height: 440, background: 'radial-gradient(ellipse, rgba(0,240,255,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: 300, height: 400, background: 'radial-gradient(ellipse, rgba(255,0,60,0.05) 0%, transparent 70%)', filter: 'blur(50px)', transform: 'translate(20px, 20px)' }}
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1.05, 0.95, 1.05] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <HoloCard src={`/images/cards/${featuredCard.set}/${featuredCard.id}.webp`} alt={featuredCard.name} width={320} height={447} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
