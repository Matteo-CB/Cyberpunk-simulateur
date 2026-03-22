'use client';

import CyberBackground from '@/components/CyberBackground';

export default function MaintenancePage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a12' }}>
      <CyberBackground />

      <div
        className="relative z-10"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <h1
          className="font-refinery"
          style={{
            fontSize: 52,
            letterSpacing: '0.14em',
            color: '#ff003c',
            textShadow: '0 0 40px rgba(255,0,60,0.4)',
            marginBottom: 16,
          }}
        >
          MAINTENANCE
        </h1>

        <p
          className="font-blender"
          style={{
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#7a8a9a',
            marginBottom: 10,
          }}
        >
          Systems are being upgraded
        </p>

        <p
          className="font-blender"
          style={{
            fontSize: 12,
            color: '#3a3a4a',
          }}
        >
          We will be back online shortly. Active games will be preserved.
        </p>

        <div
          style={{
            marginTop: 36,
            width: 200,
            height: 2,
            background: 'linear-gradient(to right, transparent, #ff003c, transparent)',
          }}
        />
      </div>
    </div>
  );
}
