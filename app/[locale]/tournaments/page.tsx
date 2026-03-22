'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import { Link } from '@/lib/i18n/navigation';

interface Tournament {
  id: string;
  name: string;
  type: string;
  status: string;
  maxPlayers: number;
  participants: { length: number }[] | number;
  creatorId: string;
}

export default function TournamentsPage() {
  const t = useTranslations('tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.json())
      .then((data) => { setTournaments(data.tournaments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    pending: '#fcee09',
    in_progress: '#22c55e',
    completed: '#7a8a9a',
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10 flex flex-col min-h-screen"
        style={{ padding: '32px 24px', maxWidth: 900, width: '100%', margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          <button
            className="font-blender"
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: '10px 22px',
              borderRadius: 6,
              cursor: 'pointer',
              background: 'rgba(0,240,255,0.06)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,240,255,0.12)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0,240,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,240,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {t('create')}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="font-blender" style={{ fontSize: 13, textAlign: 'center', padding: '60px 0', color: '#7a8a9a' }}>
            Loading...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="font-blender" style={{ fontSize: 13, textAlign: 'center', padding: '60px 0', color: '#3a3a4a' }}>
            No tournaments yet. Create one!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tournaments.map((tournament, i) => {
              const sColor = statusColors[tournament.status] || '#7a8a9a';
              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/tournaments/${tournament.id}`}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: '#111119',
                        border: '1px solid #1e2030',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00f0ff40';
                        e.currentTarget.style.background = '#1a1a25';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1e2030';
                        e.currentTarget.style.background = '#111119';
                      }}
                    >
                      <div>
                        <div className="font-blender" style={{ fontSize: 14, color: '#e0e8f0', marginBottom: 4 }}>
                          {tournament.name}
                        </div>
                        <div className="font-blender" style={{ fontSize: 11, color: '#7a8a9a' }}>
                          {tournament.type} | {tournament.maxPlayers} players max
                        </div>
                      </div>
                      <div
                        className="font-blender"
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          padding: '5px 14px',
                          borderRadius: 4,
                          background: `${sColor}12`,
                          border: `1px solid ${sColor}35`,
                          color: sColor,
                        }}
                      >
                        {tournament.status}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
