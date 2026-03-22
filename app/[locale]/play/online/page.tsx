'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CyberBackground from '@/components/CyberBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useRouter, Link } from '@/lib/i18n/navigation';

export default function PlayOnlinePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    sessionStorage.setItem('gameConfig', JSON.stringify({ mode: 'online', roomCode: code, isHost: true }));
    router.push('/game');
  };

  const handleJoinRoom = () => {
    if (roomCode.length !== 6) return;
    sessionStorage.setItem('gameConfig', JSON.stringify({ mode: 'online', roomCode, isHost: false }));
    router.push('/game');
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div className="absolute z-50" style={{ top: 16, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen"
        style={{ padding: '48px 24px', maxWidth: 600, width: '100%', margin: '0 auto' }}
      >
        {/* Title */}
        <motion.h1
          className="font-refinery tracking-wider"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            color: '#00f0ff',
            textShadow: '0 0 40px rgba(0,240,255,0.35), 0 0 80px rgba(0,240,255,0.15)',
            fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
            marginBottom: 8,
          }}
        >
          PLAY ONLINE
        </motion.h1>

        <motion.p
          className="font-blender uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.15 }}
          style={{ color: '#6b7a8a', fontSize: 11, marginBottom: 48 }}
        >
          CONNECT WITH OTHER RUNNERS
        </motion.p>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 440, width: '100%', gap: 0 }}>

          {/* Section 1: Create Room */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            style={{ padding: '0 0 32px 0' }}
          >
            <div
              className="font-blender uppercase tracking-widest"
              style={{ color: '#555', fontSize: 10, marginBottom: 14, letterSpacing: 3 }}
            >
              CREATE
            </div>
            <button
              className="font-blender uppercase tracking-widest cursor-pointer"
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: 10,
                background: '#111119',
                border: '1px solid #00f0ff40',
                color: '#00f0ff',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.25s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(0,240,255,0.12)';
                e.currentTarget.style.background = '#131325';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff40';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = '#111119';
              }}
              onClick={handleCreateRoom}
            >
              CREATE ROOM
            </button>
          </motion.div>

          {/* Separator */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2030, transparent)', marginBottom: 32 }} />

          {/* Section 2: Join by Code */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            style={{ padding: '0 0 32px 0' }}
          >
            <div
              className="font-blender uppercase tracking-widest"
              style={{ color: '#555', fontSize: 10, marginBottom: 14, letterSpacing: 3 }}
            >
              JOIN BY CODE
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="font-blender uppercase tracking-widest"
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  borderRadius: 10,
                  background: '#111119',
                  border: '1px solid #1e2030',
                  color: '#e0e8f0',
                  fontSize: 14,
                  letterSpacing: 8,
                  textAlign: 'center' as const,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                placeholder="ABC123"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#22c55e60'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#1e2030'; }}
              />
              <button
                className="font-blender uppercase tracking-widest cursor-pointer"
                style={{
                  padding: '16px 28px',
                  borderRadius: 10,
                  background: '#111119',
                  border: '1px solid #22c55e50',
                  color: '#22c55e',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: roomCode.length === 6 ? 1 : 0.4,
                  transition: 'all 0.25s',
                  outline: 'none',
                }}
                disabled={roomCode.length !== 6}
                onClick={handleJoinRoom}
                onMouseEnter={(e) => {
                  if (roomCode.length === 6) {
                    e.currentTarget.style.borderColor = '#22c55e';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(34,197,94,0.12)';
                    e.currentTarget.style.background = '#111922';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#22c55e50';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = '#111119';
                }}
              >
                JOIN
              </button>
            </div>
          </motion.div>

          {/* Separator */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e2030, transparent)', marginBottom: 32 }} />

          {/* Section 3: Find Match */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
          >
            <div
              className="font-blender uppercase tracking-widest"
              style={{ color: '#555', fontSize: 10, marginBottom: 14, letterSpacing: 3 }}
            >
              PUBLIC QUEUE
            </div>
            <button
              className="font-blender uppercase tracking-widest cursor-pointer"
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: 10,
                background: '#111119',
                border: '1px solid #fcee0940',
                color: '#fcee09',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.25s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#fcee09';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(252,238,9,0.1)';
                e.currentTarget.style.background = '#191916';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#fcee0940';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = '#111119';
              }}
            >
              FIND MATCH
            </button>
          </motion.div>
        </div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: 48 }}
        >
          <Link href="/play">
            <span
              className="font-blender uppercase tracking-widest cursor-pointer"
              style={{ color: '#555', fontSize: 11, transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#888'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; }}
            >
              Back
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
