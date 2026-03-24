'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface UserInfo {
  username: string;
  elo: number;
  gamesPlayed: number;
  placementCompleted: boolean;
  wins: number;
  losses: number;
}

const LEAGUES = [
  { key: 'cyberpunk', minElo: 2000, maxElo: null, color: '#FFD700', symbol: '\u2666' },
  { key: 'night_city_legend', minElo: 1600, maxElo: 1999, color: '#FCAC00', symbol: '\u2605' },
  { key: 'afterlife_regular', minElo: 1200, maxElo: 1599, color: '#FF003C', symbol: '\u25C9' },
  { key: 'fixer', minElo: 1000, maxElo: 1199, color: '#00F0FF', symbol: '\u26A1' },
  { key: 'netrunner', minElo: 800, maxElo: 999, color: '#A855F7', symbol: '\u2726' },
  { key: 'solo', minElo: 550, maxElo: 799, color: '#3B82F6', symbol: '\u25C6' },
  { key: 'edgerunner', minElo: 450, maxElo: 549, color: '#22C55E', symbol: '\u25C8' },
  { key: 'streetkid', minElo: 0, maxElo: 449, color: '#6B7280', symbol: '\u25E6' },
];

const PAGE_SIZE = 25;

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLeagues, setShowLeagues] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch current user info
  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCurrentUser(d); })
      .catch(() => {});
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}&search=${search}`)
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data.players || []);
        setTotal(data.total || data.players?.length || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userTier = currentUser ? getLeagueTierForPlayer(currentUser.elo, currentUser.placementCompleted) : null;

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
            marginBottom: 24,
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

        {/* Current user rank + placement info */}
        {currentUser && (
          <div
            style={{
              marginBottom: 24,
              padding: '20px 28px',
              background: '#111119',
              borderRadius: 10,
              border: `1px solid ${userTier?.color || '#1e2030'}20`,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            {/* User tier badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28, color: userTier?.color || '#4a4a5a' }}>{userTier?.symbol || '?'}</span>
              <div>
                <div className="font-refinery" style={{ fontSize: 20, color: userTier?.color || '#4a4a5a', letterSpacing: '0.1em' }}>
                  {currentUser.placementCompleted ? userTier?.name : t('unranked')}
                </div>
                <div className="font-blender" style={{ fontSize: 12, color: '#5a6a7a' }}>
                  {t('yourRank')}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 40, background: '#1e2030' }} />

            {/* ELO */}
            <div>
              <div className="font-refinery" style={{ fontSize: 24, color: '#e0e8f0' }}>{currentUser.elo}</div>
              <div className="font-blender" style={{ fontSize: 11, color: '#5a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ELO</div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 40, background: '#1e2030' }} />

            {/* W/L */}
            <div>
              <div className="font-blender" style={{ fontSize: 16, color: '#e0e8f0' }}>
                <span style={{ color: '#22c55e' }}>{currentUser.wins}W</span>
                {' / '}
                <span style={{ color: '#ff003c' }}>{currentUser.losses}L</span>
              </div>
              <div className="font-blender" style={{ fontSize: 11, color: '#5a6a7a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Record</div>
            </div>

            {/* Placement progress (if not completed) */}
            {!currentUser.placementCompleted && (
              <>
                <div style={{ width: 1, height: 40, background: '#1e2030' }} />
                <div>
                  <div className="font-blender" style={{ fontSize: 14, fontWeight: 700, color: '#fcee09' }}>
                    {t('placementGames', { count: Math.min(currentUser.gamesPlayed, 5) })}
                  </div>
                  <div className="font-blender" style={{ fontSize: 11, color: '#5a6a7a' }}>
                    {t('placementDesc')}
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginTop: 6, width: 120, height: 4, background: '#1e2030', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(Math.min(currentUser.gamesPlayed, 5) / 5) * 100}%`,
                      height: '100%',
                      background: '#fcee09',
                      borderRadius: 2,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Leagues toggle */}
        <button
          className="font-blender cursor-pointer"
          onClick={() => setShowLeagues(!showLeagues)}
          style={{
            marginBottom: 16,
            padding: '10px 20px',
            background: '#111119',
            border: '1px solid #1e2030',
            borderRadius: 8,
            color: '#00f0ff',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            alignSelf: 'flex-start',
          }}
        >
          {showLeagues ? t('hideLeagues') : t('showLeagues')}
        </button>

        {/* Leagues section */}
        <AnimatePresence>
          {showLeagues && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: 24 }}
            >
              <div style={{
                padding: '24px 28px',
                background: '#111119',
                borderRadius: 12,
                border: '1px solid #1e2030',
              }}>
                <h2 className="font-refinery" style={{ fontSize: 20, color: '#00f0ff', letterSpacing: '0.15em', marginBottom: 8 }}>
                  {t('leaguesTitle')}
                </h2>
                <p className="font-blender" style={{ fontSize: 12, color: '#5a6a7a', marginBottom: 20 }}>
                  {t('leaguesExplain')}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {LEAGUES.map((league) => {
                    const isCurrentTier = userTier?.key === league.key;
                    return (
                      <div
                        key={league.key}
                        style={{
                          padding: '14px 16px',
                          background: isCurrentTier ? `${league.color}08` : '#0a0a12',
                          border: `1px solid ${isCurrentTier ? league.color + '40' : '#1e2030'}`,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 22, color: league.color }}>{league.symbol}</span>
                        <div>
                          <div className="font-blender" style={{ fontSize: 13, fontWeight: 700, color: league.color }}>
                            {t(`tier_${league.key}`)}
                          </div>
                          <div className="font-blender" style={{ fontSize: 10, color: '#5a6a7a' }}>
                            {league.maxElo ? `${league.minElo} - ${league.maxElo}` : `${league.minElo}+`} ELO
                          </div>
                          <div className="font-blender" style={{ fontSize: 10, color: '#3a4a5a', marginTop: 2 }}>
                            {t(`tier_${league.key}_desc`)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div
          style={{
            marginBottom: 16,
            padding: '12px 24px',
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
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
            className="grid items-center font-blender uppercase tracking-wider"
            style={{
              gridTemplateColumns: '50px 1fr 120px 70px 50px 50px 70px',
              padding: '14px 24px',
              fontSize: 11,
              color: '#7a8a9a',
              borderBottom: '1px solid #1e2030',
              background: '#0e0e18',
              gap: 8,
            }}
          >
            <div>{t('rank')}</div>
            <div>{t('player')}</div>
            <div>{t('league')}</div>
            <div style={{ textAlign: 'center' }}>{t('elo')}</div>
            <div style={{ textAlign: 'center' }}>{t('wins')}</div>
            <div style={{ textAlign: 'center' }}>{t('losses')}</div>
            <div style={{ textAlign: 'center' }}>{t('winRate')}</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="font-blender" style={{ padding: '48px 0', textAlign: 'center', color: '#7a8a9a', fontSize: 14 }}>
              {t('loading')}
            </div>
          ) : players.length === 0 ? (
            <div className="font-blender" style={{ padding: '48px 0', textAlign: 'center', color: '#444', fontSize: 14 }}>
              {t('noPlayers')}
            </div>
          ) : (
            players.map((player, i) => {
              const globalRank = page * PAGE_SIZE + i + 1;
              const tier = getLeagueTierForPlayer(player.elo, player.placementCompleted);
              const total = player.wins + player.losses + player.draws;
              const winRate = total > 0 ? Math.round((player.wins / total) * 100) : 0;
              const isMe = currentUser?.username === player.username;

              return (
                <motion.div
                  key={player.username}
                  className="grid items-center font-blender"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    gridTemplateColumns: '50px 1fr 120px 70px 50px 50px 70px',
                    padding: '12px 24px',
                    fontSize: 13,
                    borderBottom: '1px solid #0e0e18',
                    gap: 8,
                    cursor: 'default',
                    transition: 'background 0.2s',
                    background: isMe ? 'rgba(0,240,255,0.03)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isMe ? 'rgba(0,240,255,0.06)' : '#1a1a25'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isMe ? 'rgba(0,240,255,0.03)' : 'transparent'; }}
                >
                  {/* Rank */}
                  <div style={{
                    color: globalRank <= 3 ? '#ffd700' : '#7a8a9a',
                    fontWeight: globalRank <= 3 ? 700 : 400,
                    fontSize: globalRank <= 3 ? 15 : 13,
                  }}>
                    #{globalRank}
                  </div>

                  {/* Player name */}
                  <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                    <span style={{ color: tier.color, fontSize: 14, flexShrink: 0 }}>{tier.symbol}</span>
                    <span style={{ color: isMe ? '#00f0ff' : '#e0e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.username}
                    </span>
                  </div>

                  {/* League */}
                  <div style={{ fontSize: 11, color: tier.color }}>
                    {player.placementCompleted ? tier.name : (
                      <span style={{ color: '#4a4a5a' }}>
                        {t('placementGames', { count: Math.min(player.gamesPlayed, 5) })}
                      </span>
                    )}
                  </div>

                  {/* ELO */}
                  <div style={{ textAlign: 'center', fontWeight: 700, color: tier.color, fontSize: 14 }}>
                    {player.elo}
                  </div>

                  {/* Wins */}
                  <div style={{ textAlign: 'center', color: '#22c55e' }}>{player.wins}</div>

                  {/* Losses */}
                  <div style={{ textAlign: 'center', color: '#ff003c' }}>{player.losses}</div>

                  {/* Win rate */}
                  <div style={{ textAlign: 'center', color: '#e0e8f0' }}>{winRate}%</div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 16,
            padding: '12px 24px',
          }}>
            <button
              className="font-blender cursor-pointer"
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                background: page === 0 ? '#0a0a12' : '#111119',
                border: '1px solid #1e2030',
                color: page === 0 ? '#3a3a4a' : '#00f0ff',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {t('prev')}
            </button>
            <span className="font-blender" style={{ color: '#5a6a7a', fontSize: 12 }}>
              {t('page', { current: page + 1, total: totalPages })}
            </span>
            <button
              className="font-blender cursor-pointer"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                background: page >= totalPages - 1 ? '#0a0a12' : '#111119',
                border: '1px solid #1e2030',
                color: page >= totalPages - 1 ? '#3a3a4a' : '#00f0ff',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
