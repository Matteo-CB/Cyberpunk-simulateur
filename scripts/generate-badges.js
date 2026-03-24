/**
 * Cyberpunk TCG — Generate League Rank Badges
 * Creates 8 hexagonal cyberpunk-themed badges with SVG + Sharp
 * Run with: node scripts/generate-badges.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'leagues');
const SIZE = 256; // Generate at 2x, will be used at 128

const BADGES = [
  {
    name: 'streetkid',
    label: 'STREETKID',
    symbol: '░',
    color: '#6B7280',
    glowColor: '#6B7280',
    bgColor: '#1a1a22',
    ringColor: '#4B5563',
    tier: 'I',
  },
  {
    name: 'edgerunner',
    label: 'EDGERUNNER',
    symbol: '◈',
    color: '#22C55E',
    glowColor: '#22C55E',
    bgColor: '#0a1a0f',
    ringColor: '#16A34A',
    tier: 'II',
  },
  {
    name: 'solo',
    label: 'SOLO',
    symbol: '◆',
    color: '#3B82F6',
    glowColor: '#3B82F6',
    bgColor: '#0a0f1a',
    ringColor: '#2563EB',
    tier: 'III',
  },
  {
    name: 'netrunner',
    label: 'NETRUNNER',
    symbol: '✦',
    color: '#A855F7',
    glowColor: '#A855F7',
    bgColor: '#140a1a',
    ringColor: '#9333EA',
    tier: 'IV',
  },
  {
    name: 'fixer',
    label: 'FIXER',
    symbol: '⚡',
    color: '#00F0FF',
    glowColor: '#00F0FF',
    bgColor: '#0a1419',
    ringColor: '#00D4E0',
    tier: 'V',
  },
  {
    name: 'afterlife-regular',
    label: 'AFTERLIFE',
    symbol: '◉',
    color: '#FF003C',
    glowColor: '#FF003C',
    bgColor: '#1a0a0f',
    ringColor: '#DC002E',
    tier: 'VI',
  },
  {
    name: 'night-city-legend',
    label: 'LEGEND',
    symbol: '★',
    color: '#FCAC00',
    glowColor: '#FCAC00',
    bgColor: '#1a150a',
    ringColor: '#E09800',
    tier: 'VII',
  },
  {
    name: 'cyberpunk',
    label: 'CYBERPUNK',
    symbol: '♦',
    color: '#FFD700',
    glowColor: '#FFD700',
    bgColor: '#1a180a',
    ringColor: '#FFD700',
    tier: '∞',
  },
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function generateBadgeSVG(badge, size) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.36;
  const midR = size * 0.39;

  // Hexagon points
  function hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return pts.join(' ');
  }

  // Circuit trace decorations
  const traces = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const startR = outerR * 0.92;
    const endR = outerR * 1.08;
    const x1 = cx + startR * Math.cos(angle);
    const y1 = cy + startR * Math.sin(angle);
    const x2 = cx + endR * Math.cos(angle);
    const y2 = cy + endR * Math.sin(angle);
    traces.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${badge.color}" stroke-width="1.5" opacity="0.4"/>`);

    // Small dots at vertices
    const dotR = outerR * 1.02;
    const dx = cx + dotR * Math.cos(angle);
    const dy = cy + dotR * Math.sin(angle);
    traces.push(`<circle cx="${dx}" cy="${dy}" r="2.5" fill="${badge.color}" opacity="0.6"/>`);
  }

  // Inner circuit lines
  const innerTraces = [];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI / 6) * i;
    const r1 = innerR * 0.5;
    const r2 = innerR * 0.7;
    const x1 = cx + r1 * Math.cos(angle);
    const y1 = cy + r1 * Math.sin(angle);
    const x2 = cx + r2 * Math.cos(angle);
    const y2 = cy + r2 * Math.sin(angle);
    innerTraces.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${badge.color}" stroke-width="0.5" opacity="0.15"/>`);
  }

  const isTop = BADGES.indexOf(badge) >= 6; // Legend & Cyberpunk get extra flair
  const isCyberpunk = badge.name === 'cyberpunk';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Outer glow -->
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${isCyberpunk ? 12 : 8}" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Radial gradient for inner fill -->
    <radialGradient id="innerFill" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${hexToRgba(badge.color, 0.12)}"/>
      <stop offset="100%" stop-color="${badge.bgColor}"/>
    </radialGradient>
    <!-- Ring gradient -->
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${badge.color}"/>
      <stop offset="50%" stop-color="${badge.ringColor}"/>
      <stop offset="100%" stop-color="${badge.color}"/>
    </linearGradient>
    <!-- Scanline pattern -->
    <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="2" fill="${badge.color}" fill-opacity="0.03"/>
    </pattern>
    <!-- Grid pattern -->
    <pattern id="grid" patternUnits="userSpaceOnUse" width="12" height="12">
      <path d="M 12 0 L 0 0 0 12" fill="none" stroke="${badge.color}" stroke-width="0.3" stroke-opacity="0.06"/>
    </pattern>
  </defs>

  <!-- Outer glow halo -->
  <polygon points="${hexPoints(cx, cy, outerR * 1.05)}" fill="none" stroke="${badge.glowColor}" stroke-width="${isCyberpunk ? 4 : 2}" opacity="${isCyberpunk ? 0.5 : 0.25}" filter="url(#glow)"/>

  <!-- Outer hexagon border -->
  <polygon points="${hexPoints(cx, cy, outerR)}" fill="none" stroke="url(#ringGrad)" stroke-width="2.5" opacity="0.9"/>

  <!-- Mid hexagon (subtle) -->
  <polygon points="${hexPoints(cx, cy, midR)}" fill="none" stroke="${badge.color}" stroke-width="0.5" opacity="0.2" stroke-dasharray="4 4"/>

  <!-- Inner hexagon fill -->
  <polygon points="${hexPoints(cx, cy, innerR)}" fill="url(#innerFill)" stroke="${badge.color}" stroke-width="1" opacity="0.9"/>

  <!-- Grid overlay -->
  <polygon points="${hexPoints(cx, cy, innerR)}" fill="url(#grid)" opacity="0.5"/>

  <!-- Scanlines -->
  <polygon points="${hexPoints(cx, cy, innerR)}" fill="url(#scanlines)"/>

  <!-- Circuit traces at vertices -->
  ${traces.join('\n  ')}

  <!-- Inner circuit lines -->
  ${innerTraces.join('\n  ')}

  <!-- Central symbol -->
  <text x="${cx}" y="${cy - size * 0.02}" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, sans-serif" font-size="${size * 0.22}" font-weight="bold"
        fill="${badge.color}" filter="url(#innerGlow)" opacity="0.95">
    ${badge.symbol}
  </text>


  ${isTop ? `
  <!-- Top tier crown dots -->
  <circle cx="${cx - 12}" cy="${cy - size * 0.28}" r="2" fill="${badge.color}" opacity="0.6"/>
  <circle cx="${cx}" cy="${cy - size * 0.31}" r="2.5" fill="${badge.color}" opacity="0.8"/>
  <circle cx="${cx + 12}" cy="${cy - size * 0.28}" r="2" fill="${badge.color}" opacity="0.6"/>
  ` : ''}

  ${isCyberpunk ? `
  <!-- Extra outer ring for max rank -->
  <polygon points="${hexPoints(cx, cy, outerR * 1.12)}" fill="none" stroke="${badge.color}" stroke-width="1" opacity="0.3" stroke-dasharray="6 3"/>
  <polygon points="${hexPoints(cx, cy, outerR * 1.18)}" fill="none" stroke="${badge.color}" stroke-width="0.5" opacity="0.15"/>
  ` : ''}
</svg>`;
}

async function main() {
  console.log('\n⚡ Generating League Rank Badges\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const badge of BADGES) {
    const svg = generateBadgeSVG(badge, SIZE);
    const outputPath = path.join(OUTPUT_DIR, `${badge.name}.webp`);

    await sharp(Buffer.from(svg))
      .resize(SIZE, SIZE)
      .webp({ quality: 90 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`  ✓ ${badge.name}.webp (${SIZE}x${SIZE}, ${(stats.size / 1024).toFixed(1)}KB) — ${badge.symbol} ${badge.label}`);
  }

  console.log('\n╔══════════════════════════════════╗');
  console.log('║    8 BADGES GENERATED            ║');
  console.log('╚══════════════════════════════════╝\n');
}

main().catch(console.error);
