'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link } from '@/lib/i18n/navigation';
import { getLeagueTierForPlayer } from '@/lib/elo/elo';

interface LeaderboardEntry {
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  placementCompleted: boolean;
  gamesPlayed: number;
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leaderboard?limit=50&search=${search}`)
      .then((r) => r.json())
      .then((data) => { setPlayers(data.players || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="absolute top-4 right-5 z-50"><LanguageSwitcher /></div>

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ maxWidth: 960, padding: '40px 48px', width: '100%', margin: '0 auto' }}
      >
        {/* Header */}
        <div
          className="flex items-center"
          style={{
            marginBottom: 32,
            padding: '24px 32px',
            background: '#111119',
            borderRadius: 12,
            border: '1px solid #1e2030',
            gap: 24,
          }}
        >
          <Link href="/">
            <span
              className="font-blender cursor-pointer"
              style={{
                color: '#7a8a9a',
                fontSize: 13,
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid #1e2030',
                background: '#0a0a12',
              }}
            >
              Back
            </span>
          </Link>
          <h1
            className="font-refinery tracking-wider"
            style={{ color: '#00f0ff', fontSize: 36, letterSpacing: 4 }}
          >
            {t('title')}
          </h1>
        </div>

        {/* Search */}
        <div
          style={{
            marginBottom: 24,
            padding: '16px 24px',
            background: '#111119',
            borderRadius: 10,
            border: '1px solid #1e2030',
          }}
        >
          <input
            className="font-blender outline-none"
            style={{
              background: '#0a0a12',
              border: '1px solid #1e2030',
              color: '#e0e8f0',
              maxWidth: 320,
              width: '100%',
              fontSize: 14,
              padding: '10px 18px',
              borderRadius: 8,
            }}
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div
          className="overflow-hidden"
          style={{
            background: '#111119',
            borderRadius: 12,
            border: '1px solid #1e2030',
          }}
        >
          {/* Table Header */}
          <div
            className="grid grid-cols-7 items-center font-blender uppercase tracking-wider"
            style={{
              padding: '16px 28px',
              fontSize: 12,
              color: '#7a8a9a',
              borderBottom: '1px solid #1e2030',
              background: '#0e0e18',
              gap: 12,
            }}
          >
            <div>{t('rank')}</div>
            <div className="col-span-2">{t('player')}</div>
            <div style={{ textAlign: 'center' }}>{t('elo')}</div>
            <div style={{ textAlign: 'center' }}>{t('wins')}</div>
            <div style={{ textAlign: 'center' }}>{t('losses')}</div>
            <div style={{ textAlign: 'center' }}>{t('winRate')}</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div
              className="font-blender"
              style={{ padding: '48px 0', textAlign: 'center', color: '#7a8a9a', fontSize: 14 }}
            >
              Loading...
            </div>
          ) : players.length === 0 ? (
            <div
              className="font-blender"
              style={{ padding: '48px 0', textAlign: 'center', color: '#444', fontSize: 14 }}
            >
              No players found
            </div>
          ) : (
            players.map((player, i) => {
              const tier = getLeagueTierForPlayer(player.elo, player.placementCompleted);
              const total = player.wins + player.losses + player.draws;
              const winRate = total > 0 ? Math.round((player.wins / total) * 100) : 0;

              return (
                <motion.div
                  key={player.username}
                  className="grid grid-cols-7 items-center font-blender"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025 }}
                  style={{
                    padding: '14px 28px',
                    fontSize: 14,
                    borderBottom: '1px solid #0e0e18',
                    gap: 12,
                    cursor: 'default',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a25'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    style={{
                      color: i < 3 ? '#ffd700' : '#7a8a9a',
                      fontWeight: i < 3 ? 700 : 400,
                      fontSize: i < 3 ? 16 : 14,
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div
                    className="col-span-2 flex items-center"
                    style={{ gap: 10 }}
                  >
                    <span style={{ color: tier.color, fontSize: 16 }}>{tier.symbol}</span>
                    <span style={{ color: '#e0e8f0' }}>{player.username}</span>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      color: tier.color,
                      fontSize: 15,
                    }}
                  >
                    {player.elo}
                  </div>
                  <div style={{ textAlign: 'center', color: '#22c55e' }}>{player.wins}</div>
                  <div style={{ textAlign: 'center', color: '#ff003c' }}>{player.losses}</div>
                  <div style={{ textAlign: 'center', color: '#e0e8f0' }}>{winRate}%</div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
