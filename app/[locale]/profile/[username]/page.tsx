'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';
import { getLeagueTier } from '@/lib/elo/elo';
import Image from 'next/image';

interface ProfileData {
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  tournamentWins: number;
  discordUsername?: string;
  createdAt: string;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${username}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a12',
        }}
      >
        <div className="font-blender animate-pulse" style={{ fontSize: 13, color: '#00f0ff' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0a12',
          gap: 16,
        }}
      >
        <div className="font-blender" style={{ fontSize: 13, color: '#ff003c' }}>Player not found</div>
        <Link href="/">
          <span
            className="font-blender"
            style={{ fontSize: 11, cursor: 'pointer', color: '#3a3a4a', transition: 'color 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a4a'; }}
          >
            Back to Menu
          </span>
        </Link>
      </div>
    );
  }

  const tier = getLeagueTier(profile.elo);
  const total = profile.wins + profile.losses + profile.draws;
  const winRate = total > 0 ? Math.round((profile.wins / total) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 800, width: '100%', margin: '0 auto' }}
      >
        {/* Back link */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/leaderboard">
            <span
              className="font-blender"
              style={{ fontSize: 11, cursor: 'pointer', color: '#3a3a4a', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7a8a9a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a4a'; }}
            >
              Back to Leaderboard
            </span>
          </Link>
        </div>

        {/* Profile Header */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 36 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Badge */}
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <Image
              src={`/images/leagues/${tier.key.replace('_', '-')}.webp`}
              alt={tier.name}
              fill
              className="object-contain"
              sizes="100px"
            />
          </div>

          <h1
            className="font-refinery"
            style={{
              fontSize: 34,
              letterSpacing: '0.1em',
              color: '#e0e8f0',
              textShadow: '0 0 15px rgba(224,232,240,0.08)',
            }}
          >
            {profile.username}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="font-blender" style={{ fontSize: 14, color: tier.color }}>
              {tier.symbol} {tier.name}
            </span>
            <span style={{ color: '#2a2a3a', fontSize: 14 }}>|</span>
            <span className="font-blender" style={{ fontSize: 14, color: tier.color }}>
              {profile.elo} ELO
            </span>
          </div>

          {profile.discordUsername && (
            <div className="font-blender" style={{ fontSize: 12, color: '#5865F2' }}>
              Discord: {profile.discordUsername}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Wins', value: profile.wins, color: '#22c55e' },
            { label: 'Losses', value: profile.losses, color: '#ff003c' },
            { label: 'Draws', value: profile.draws, color: '#7a8a9a' },
            { label: 'Win Rate', value: `${winRate}%`, color: '#fcee09' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{
                padding: 18,
                borderRadius: 8,
                textAlign: 'center',
                background: '#111119',
                border: '1px solid #1e2030',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <div className="font-refinery" style={{ fontSize: 22, color: stat.color, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div
                className="font-blender"
                style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7a8a9a' }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tournament Wins */}
        {profile.tournamentWins > 0 && (
          <div
            style={{
              padding: 18,
              borderRadius: 8,
              textAlign: 'center',
              marginBottom: 20,
              background: 'rgba(255,215,0,0.04)',
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <div className="font-refinery" style={{ fontSize: 22, color: '#ffd700', marginBottom: 4 }}>
              {profile.tournamentWins}
            </div>
            <div
              className="font-blender"
              style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#ffd700' }}
            >
              Tournament Wins
            </div>
          </div>
        )}

        {/* Member Since */}
        <div
          className="font-blender"
          style={{ fontSize: 11, textAlign: 'center', color: '#3a3a4a', marginTop: 12 }}
        >
          Member since {new Date(profile.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
