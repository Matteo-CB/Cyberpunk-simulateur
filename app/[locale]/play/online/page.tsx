'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useRouter, Link } from '@/lib/i18n/navigation';
import { io, type Socket } from 'socket.io-client';

interface PublicRoom {
  code: string;
  hostUsername: string;
  gameMode: 'casual' | 'ranked';
  isRanked: boolean;
  createdAt: number;
}

interface ActiveGame {
  code: string;
  player1: string;
  player2: string | null;
  gameMode: 'casual' | 'ranked';
  isRanked: boolean;
  isPrivate: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const btnStyle = (color: string, active = false): React.CSSProperties => ({
  fontFamily: 'var(--font-blender)', fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
  background: active ? `${color}15` : 'transparent',
  border: `1px solid ${active ? `${color}60` : '#1e2030'}`,
  color: active ? color : '#5a6a7a',
  transition: 'all 0.2s',
});

export default function PlayOnlinePage() {
  const t = useTranslations('online');
  const tc = useTranslations('common');
  const router = useRouter();
  const [view, setView] = useState<'public' | 'private'>('public');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [privateMode, setPrivateMode] = useState<'casual' | 'ranked'>('casual');
  const [error, setError] = useState<string | null>(null);

  // Fetch user session
  useEffect(() => {
    fetch('/api/user/me').then((r) => r.ok ? r.json() : null).then((data) => {
      if (data?.id) setUser({ id: data.id, username: data.username });
    }).catch(() => {});
  }, []);

  // Connect socket
  useEffect(() => {
    if (!user) return;
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    s.on('connect', () => {
      setConnected(true);
      s.emit('auth', { userId: user.id, username: user.username });
      s.emit('room:list');
    });
    s.on('disconnect', () => setConnected(false));
    s.on('room:list-update', (rooms: PublicRoom[]) => setPublicRooms(rooms));
    s.on('games:list-update', (games: ActiveGame[]) => setActiveGames(games));
    s.on('room:updated', () => s.emit('room:list'));
    s.on('room:player-joined', () => {
      // Opponent joined — redirect to game
      router.push('/game');
    });
    setSocket(s);

    const interval = setInterval(() => s.emit('room:list'), 5000);
    return () => { clearInterval(interval); s.disconnect(); };
  }, [user]);

  const handleCreatePublic = useCallback((mode: 'casual' | 'ranked') => {
    if (!user) { setError('You must be logged in'); return; }
    if (!socket || !socket.connected) { setError('Connecting to server...'); return; }
    const code = generateRoomCode();
    socket.emit('room:create', {
      roomCode: code, userId: user.id, username: user.username,
      isPrivate: false, isRanked: mode === 'ranked', gameMode: mode,
    }, (res: { ok: boolean; error?: string }) => {
      if (res.ok) {
        setCreatedCode(code);
        sessionStorage.setItem('gameConfig', JSON.stringify({ mode: 'online', roomCode: code, isHost: true, gameMode: mode }));
      } else {
        setError(res.error || 'Failed to create room');
      }
    });
  }, [socket, user]);

  const handleCreatePrivate = useCallback(() => {
    if (!socket || !user) return;
    const code = generateRoomCode();
    socket.emit('room:create', {
      roomCode: code, userId: user.id, username: user.username,
      isPrivate: true, isRanked: privateMode === 'ranked', gameMode: privateMode,
    }, (res: { ok: boolean; error?: string }) => {
      if (res.ok) {
        setCreatedCode(code);
        sessionStorage.setItem('gameConfig', JSON.stringify({ mode: 'online', roomCode: code, isHost: true, gameMode: privateMode }));
      } else {
        setError(res.error || 'Failed to create room');
      }
    });
  }, [socket, user, privateMode]);

  const handleJoin = useCallback((code: string) => {
    if (!user) {
      setError('You must be logged in to join a room');
      return;
    }
    sessionStorage.setItem('gameConfig', JSON.stringify({ mode: 'online', roomCode: code, isHost: false }));
    router.push('/game');
  }, [user, router]);

  const casualRooms = publicRooms.filter((r) => r.gameMode === 'casual');
  const rankedRooms = publicRooms.filter((r) => r.gameMode === 'ranked');

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />
      <div className="absolute z-50" style={{ top: 16, right: 20 }}><LanguageSwitcher /></div>

      <div className="relative z-10 flex flex-col min-h-screen" style={{ maxWidth: 700, width: '100%', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="font-refinery" style={{ color: '#00f0ff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', letterSpacing: '0.15em', textShadow: '0 0 30px rgba(0,240,255,0.3)' }}>
            {t('title')}
          </h1>
          <p className="font-blender" style={{ color: '#5a6a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Connection status */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#22c55e' : '#ff003c', boxShadow: connected ? '0 0 6px #22c55e' : '0 0 6px #ff003c' }} />
            <span className="font-blender" style={{ fontSize: 10, color: connected ? '#22c55e' : '#ff003c', textTransform: 'uppercase' }}>
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8, background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.2)', color: '#ff003c', fontFamily: 'var(--font-blender)', fontSize: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p className="font-blender" style={{ color: '#5a6a7a', fontSize: 13, marginBottom: 16 }}>You must be logged in to play online.</p>
            <Link href="/login"><span className="font-blender" style={{ color: '#00f0ff', cursor: 'pointer' }}>Sign In</span></Link>
          </div>
        )}

        {user && (
          <>
            {/* Public / Private tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
              <button onClick={() => { setView('public'); setCreatedCode(null); }} style={btnStyle('#00f0ff', view === 'public')}>{t('publicRooms')}</button>
              <button onClick={() => setView('private')} style={btnStyle('#fcee09', view === 'private')}>{t('privateRooms')}</button>
            </div>

            {/* ════════ PUBLIC VIEW ════════ */}
            {view === 'public' && (
              <>
                {/* Dual columns: Casual + Ranked */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {/* Casual */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="font-blender" style={{ color: '#fcee09', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('casual')}</span>
                      <button onClick={() => handleCreatePublic('casual')} className="font-blender" style={{ fontSize: 10, color: '#fcee09', background: 'rgba(252,238,9,0.06)', border: '1px solid rgba(252,238,9,0.2)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', textTransform: 'uppercase' }}>
                        + {t('createRoom')}
                      </button>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {casualRooms.length === 0 && (
                        <p className="font-blender" style={{ color: '#3a3a4a', fontSize: 11, fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>{t('noRooms')}</p>
                      )}
                      {casualRooms.map((room) => (
                        <div key={room.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#0d0d1a', border: '1px solid #1a1a25', borderRadius: 8 }}>
                          <div>
                            <span className="font-blender" style={{ color: '#c0c8d0', fontSize: 12 }}>{room.hostUsername}</span>
                            <span className="font-blender" style={{ color: '#3a3a4a', fontSize: 10, marginLeft: 8 }}>{timeAgo(room.createdAt)}</span>
                          </div>
                          <button onClick={() => handleJoin(room.code)} className="font-blender" style={{ fontSize: 10, color: '#fcee09', background: 'rgba(252,238,9,0.08)', border: '1px solid rgba(252,238,9,0.3)', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', textTransform: 'uppercase' }}>
                            {t('joinRoom')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ranked */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="font-blender" style={{ color: '#ff003c', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('ranked')}</span>
                      <button onClick={() => handleCreatePublic('ranked')} className="font-blender" style={{ fontSize: 10, color: '#ff003c', background: 'rgba(255,0,60,0.06)', border: '1px solid rgba(255,0,60,0.2)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', textTransform: 'uppercase' }}>
                        + {t('createRoom')}
                      </button>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {rankedRooms.length === 0 && (
                        <p className="font-blender" style={{ color: '#3a3a4a', fontSize: 11, fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>{t('noRooms')}</p>
                      )}
                      {rankedRooms.map((room) => (
                        <div key={room.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#0d0d1a', border: '1px solid #1a1a25', borderRadius: 8 }}>
                          <div>
                            <span className="font-blender" style={{ color: '#c0c8d0', fontSize: 12 }}>{room.hostUsername}</span>
                            <span className="font-blender" style={{ color: '#3a3a4a', fontSize: 10, marginLeft: 8 }}>{timeAgo(room.createdAt)}</span>
                          </div>
                          <button onClick={() => handleJoin(room.code)} className="font-blender" style={{ fontSize: 10, color: '#ff003c', background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.3)', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', textTransform: 'uppercase' }}>
                            {t('joinRoom')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Games */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2030, transparent)', marginBottom: 16 }} />
                  <span className="font-blender" style={{ color: '#5a6a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('activeGames')}</span>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {activeGames.length === 0 && (
                      <p className="font-blender" style={{ color: '#3a3a4a', fontSize: 11, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>{t('noActiveGames')}</p>
                    )}
                    {activeGames.filter((g) => !g.isPrivate).map((game) => (
                      <div key={game.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0d0d1a', border: '1px solid #1a1a25', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="font-blender" style={{ color: '#c0c8d0', fontSize: 12 }}>{game.player1}</span>
                          <span className="font-blender" style={{ color: '#3a3a4a', fontSize: 10 }}>{t('vs')}</span>
                          <span className="font-blender" style={{ color: '#c0c8d0', fontSize: 12 }}>{game.player2 || '...'}</span>
                        </div>
                        <span className="font-blender" style={{ fontSize: 10, color: game.isRanked ? '#ff003c' : '#fcee09', textTransform: 'uppercase' }}>
                          {game.isRanked ? t('ranked') : t('casual')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ════════ PRIVATE VIEW ════════ */}
            {view === 'private' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400, margin: '0 auto', width: '100%' }}>
                {createdCode ? (
                  /* Room created — show code */
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p className="font-blender" style={{ color: '#5a6a7a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('roomCode')}</p>
                    <div className="font-refinery" style={{ fontSize: 40, color: '#fcee09', letterSpacing: '0.3em', textShadow: '0 0 20px rgba(252,238,9,0.3)', marginBottom: 16 }}>
                      {createdCode}
                    </div>
                    <motion.p
                      className="font-blender"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ color: '#5a6a7a', fontSize: 12 }}
                    >
                      {t('waitingOpponent')}
                    </motion.p>
                    <button
                      onClick={() => router.push('/game')}
                      className="font-blender"
                      style={{ marginTop: 20, padding: '10px 28px', borderRadius: 8, background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff', fontSize: 12, cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      GO TO GAME
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mode selection */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={() => setPrivateMode('casual')} style={btnStyle('#fcee09', privateMode === 'casual')}>{t('casual')}</button>
                      <button onClick={() => setPrivateMode('ranked')} style={btnStyle('#ff003c', privateMode === 'ranked')}>{t('ranked')}</button>
                    </div>

                    {/* Create */}
                    <button onClick={handleCreatePrivate} className="font-blender" style={{
                      width: '100%', padding: '14px 20px', borderRadius: 8,
                      background: '#0d0d1a', border: '1px solid #00f0ff30', color: '#00f0ff',
                      fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
                      transition: 'all 0.2s',
                    }}>
                      {t('createPrivate')}
                    </button>

                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2030, transparent)' }} />

                    {/* Join by code */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="font-blender"
                        placeholder={t('enterCode')}
                        maxLength={6}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        style={{
                          flex: 1, padding: '12px 16px', borderRadius: 8,
                          background: '#0d0d1a', border: '1px solid #1e2030', color: '#e0e8f0',
                          fontSize: 14, letterSpacing: '0.3em', textAlign: 'center', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleJoin(joinCode)}
                        disabled={joinCode.length !== 6}
                        className="font-blender"
                        style={{
                          padding: '12px 24px', borderRadius: 8,
                          background: '#0d0d1a', border: '1px solid #22c55e30', color: '#22c55e',
                          fontSize: 12, cursor: joinCode.length === 6 ? 'pointer' : 'default',
                          opacity: joinCode.length === 6 ? 1 : 0.4, textTransform: 'uppercase',
                        }}
                      >
                        {t('joinRoom')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link href="/play">
            <span className="font-blender" style={{ color: '#4a4a5a', fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {tc('back')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
