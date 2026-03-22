'use client';

import { motion } from 'framer-motion';

const GRID_LINES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  isVertical: i % 2 === 0,
  position: 8 + (i * 10),
  delay: i * 0.6,
  duration: 8 + (i % 4) * 3,
  opacity: 0.025 + (i % 3) * 0.01,
}));

// Deterministic pseudo-random to avoid SSR/client hydration mismatch
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: seededRandom(i * 7 + 1) * 100,
  y: seededRandom(i * 13 + 3) * 100,
  size: 1 + seededRandom(i * 17 + 5) * 2.5,
  delay: seededRandom(i * 23 + 7) * 8,
  duration: 10 + seededRandom(i * 29 + 11) * 15,
}));

const ORBS = [
  { x: '15%', y: '25%', size: 400, color: '0, 240, 255', opacity: 0.035, duration: 20 },
  { x: '75%', y: '60%', size: 350, color: '255, 0, 60', opacity: 0.025, duration: 25 },
  { x: '50%', y: '85%', size: 300, color: '252, 238, 9', opacity: 0.015, duration: 18 },
  { x: '85%', y: '15%', size: 250, color: '168, 85, 247', opacity: 0.02, duration: 22 },
];

export default function CyberBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Deep dark base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #06060e 0%, #0a0a14 30%, #080812 60%, #0a0a12 100%)',
        }}
      />

      {/* Animated color orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, rgba(${orb.color}, ${orb.opacity}) 0%, transparent 70%)`,
            filter: 'blur(60px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 0.9, 1.1, 1],
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 15, -10, 0],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Cyber grid */}
      <div className="absolute inset-0 cyber-grid" style={{ opacity: 0.4 }} />

      {/* Animated light lines */}
      {GRID_LINES.map((line) => (
        <motion.div
          key={`line-${line.id}`}
          className="absolute"
          style={{
            [line.isVertical ? 'left' : 'top']: `${line.position}%`,
            [line.isVertical ? 'top' : 'left']: 0,
            [line.isVertical ? 'width' : 'height']: '1px',
            [line.isVertical ? 'height' : 'width']: '100%',
            background: line.isVertical
              ? `linear-gradient(to bottom, transparent, rgba(0, 240, 255, ${line.opacity}), transparent)`
              : `linear-gradient(to right, transparent, rgba(255, 0, 60, ${line.opacity}), transparent)`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: line.duration,
            delay: line.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={`particle-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 4 === 0 ? '#00f0ff' : p.id % 4 === 1 ? '#ff003c' : p.id % 4 === 2 ? '#fcee09' : '#a855f7',
          }}
          animate={{
            y: [0, -(20 + Math.random() * 30), 0],
            x: [0, 8 - Math.random() * 16, 0],
            opacity: [0, 0.5, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}
