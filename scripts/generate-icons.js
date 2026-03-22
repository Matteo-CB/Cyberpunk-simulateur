/**
 * Cyberpunk TCG — Generate all PWA icons + OG image
 * Uses card art (V - Corporate Exile) as base with cyberpunk styling
 * Run with: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CARDS_DIR = path.join(__dirname, '..', 'public', 'images', 'cards', 'ALPHA');
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// V - Corporate Exile (iconic card for branding)
const HERO_CARD = path.join(CARDS_DIR, 'ALPHA-003.webp');
// Adam Smasher for OG image background
const BG_CARD = path.join(CARDS_DIR, 'ALPHA-045.webp');
// Mantis Blades for OG accent
const ACCENT_CARD = path.join(CARDS_DIR, 'ALPHA-019.webp');

async function generateIcon(size, outputPath, format = 'png') {
  // Extract center crop from card art
  const cardMeta = await sharp(HERO_CARD).metadata();
  const cropSize = Math.min(cardMeta.width, cardMeta.height);
  const cropX = Math.floor((cardMeta.width - cropSize) / 2);
  const cropY = Math.floor(cardMeta.height * 0.08); // Slightly below top to get face area

  // Create the icon with cyberpunk overlay
  const cardCrop = await sharp(HERO_CARD)
    .extract({
      left: cropX,
      top: cropY,
      width: cropSize,
      height: Math.min(cropSize, cardMeta.height - cropY),
    })
    .resize(size, size, { fit: 'cover', position: 'center' })
    .toBuffer();

  // Create cyan border overlay
  const borderWidth = Math.max(2, Math.floor(size * 0.04));
  const innerSize = size - borderWidth * 2;

  // Dark overlay with cyan tint
  const overlay = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0a12" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.15"/>
        </linearGradient>
        <linearGradient id="border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00f0ff"/>
          <stop offset="50%" stop-color="#ff003c"/>
          <stop offset="100%" stop-color="#00f0ff"/>
        </linearGradient>
      </defs>
      <!-- Border -->
      <rect x="0" y="0" width="${size}" height="${size}" rx="${Math.floor(size * 0.15)}" fill="url(#border)"/>
      <!-- Inner background -->
      <rect x="${borderWidth}" y="${borderWidth}" width="${innerSize}" height="${innerSize}" rx="${Math.floor(size * 0.12)}" fill="#0a0a12"/>
      <!-- Tint overlay -->
      <rect x="${borderWidth}" y="${borderWidth}" width="${innerSize}" height="${innerSize}" rx="${Math.floor(size * 0.12)}" fill="url(#bg)"/>
    </svg>`
  );

  // Compose: card crop + overlay
  const composed = await sharp(cardCrop)
    .composite([
      {
        input: overlay,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();

  // Final rounded mask
  const roundedMask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${Math.floor(size * 0.15)}" fill="white"/>
    </svg>`
  );

  let pipeline = sharp(composed)
    .composite([
      { input: roundedMask, blend: 'dest-in' },
    ]);

  if (format === 'png') {
    await pipeline.png({ quality: 90 }).toFile(outputPath);
  } else if (format === 'ico') {
    // For ico, save as png first then we'll handle it
    await pipeline.png().toFile(outputPath.replace('.ico', '.png'));
  }

  console.log(`  ✓ ${path.basename(outputPath)} (${size}x${size})`);
}

async function generateOGImage() {
  const width = 1200;
  const height = 630;

  // Load and resize cards for composition
  const heroCard = await sharp(HERO_CARD)
    .resize(280, 391, { fit: 'cover' })
    .toBuffer();

  const bgCard = await sharp(BG_CARD)
    .resize(280, 391, { fit: 'cover' })
    .toBuffer();

  const accentCard = await sharp(ACCENT_CARD)
    .resize(280, 391, { fit: 'cover' })
    .toBuffer();

  // Create dark base with gradient
  const base = Buffer.from(
    `<svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0a0a12"/>
          <stop offset="40%" stop-color="#0d0d1a"/>
          <stop offset="100%" stop-color="#0a0a12"/>
        </linearGradient>
        <radialGradient id="glow1" cx="0.2" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#00f0ff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="0.85" cy="0.4" r="0.4">
          <stop offset="0%" stop-color="#ff003c" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#ff003c" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0"/>
          <stop offset="20%" stop-color="#00f0ff" stop-opacity="0.6"/>
          <stop offset="80%" stop-color="#ff003c" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#ff003c" stop-opacity="0"/>
        </linearGradient>
        <!-- Grid pattern -->
        <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f0ff" stroke-width="0.3" stroke-opacity="0.08"/>
        </pattern>
        <!-- Scanlines -->
        <pattern id="scan" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="2" fill="#00f0ff" fill-opacity="0.015"/>
        </pattern>
      </defs>

      <!-- Base -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      <rect width="${width}" height="${height}" fill="url(#glow1)"/>
      <rect width="${width}" height="${height}" fill="url(#glow2)"/>
      <rect width="${width}" height="${height}" fill="url(#scan)"/>

      <!-- Decorative lines -->
      <rect x="0" y="280" width="${width}" height="1" fill="url(#line)"/>
      <rect x="0" y="350" width="${width}" height="1" fill="url(#line)" opacity="0.3"/>

      <!-- Top accent line -->
      <rect x="0" y="0" width="${width}" height="3" fill="#00f0ff" opacity="0.8"/>
      <!-- Bottom accent line -->
      <rect x="0" y="${height - 3}" width="${width}" height="3" fill="#ff003c" opacity="0.6"/>

      <!-- Title: CYBERPUNK -->
      <text x="80" y="200" font-family="Impact, Arial Black, sans-serif" font-size="96" font-weight="900"
            fill="#00f0ff" letter-spacing="8" opacity="0.95"
            filter="url(#textGlow)">CYBERPUNK</text>

      <!-- Subtitle -->
      <text x="84" y="250" font-family="Arial, sans-serif" font-size="22" font-weight="400"
            fill="#7a8a9a" letter-spacing="12">TCG SIMULATOR</text>

      <!-- Bottom text -->
      <text x="80" y="560" font-family="Arial, sans-serif" font-size="16"
            fill="#3a3a5a" letter-spacing="4">PLAY • BUILD • COMPETE</text>

      <!-- Vignette -->
      <rect width="${width}" height="${height}" fill="url(#vignette)" opacity="0.4"/>
    </svg>`
  );

  // Card shadow/glow effect
  const cardGlow = Buffer.from(
    `<svg width="${width}" height="${height}">
      <defs>
        <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Glow behind cards -->
      <ellipse cx="920" cy="300" rx="200" ry="250" fill="#00f0ff" opacity="0.04" filter="url(#cardGlow)"/>
      <ellipse cx="980" cy="320" rx="160" ry="200" fill="#ff003c" opacity="0.03" filter="url(#cardGlow)"/>
    </svg>`
  );

  await sharp(base)
    .composite([
      { input: cardGlow, blend: 'screen' },
      // Background card (tilted left, behind)
      {
        input: await sharp(bgCard)
          .modulate({ brightness: 0.6 })
          .rotate(-8, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        left: 720,
        top: 100,
        blend: 'over',
      },
      // Accent card (tilted right, behind)
      {
        input: await sharp(accentCard)
          .modulate({ brightness: 0.7 })
          .rotate(6, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        left: 920,
        top: 80,
        blend: 'over',
      },
      // Hero card (front, center-right)
      {
        input: heroCard,
        left: 830,
        top: 120,
        blend: 'over',
      },
    ])
    .webp({ quality: 90 })
    .toFile(path.join(IMAGES_DIR, 'og-image.webp'));

  console.log(`  ✓ og-image.webp (1200x630)`);
}

async function main() {
  console.log('\n⚡ Generating Cyberpunk TCG icons & OG image\n');

  // Check hero card exists
  if (!fs.existsSync(HERO_CARD)) {
    console.error(`Missing card image: ${HERO_CARD}`);
    process.exit(1);
  }

  fs.mkdirSync(ICONS_DIR, { recursive: true });

  console.log('═══ PWA ICONS ═══');
  await generateIcon(32, path.join(ICONS_DIR, 'favicon-32x32.png'));
  await generateIcon(180, path.join(ICONS_DIR, 'apple-touch-icon.png'));
  await generateIcon(192, path.join(ICONS_DIR, 'icon-192x192.png'));
  await generateIcon(512, path.join(ICONS_DIR, 'icon-512x512.png'));

  // Generate favicon.ico from the 32px png
  const favicon32 = await sharp(path.join(ICONS_DIR, 'favicon-32x32.png'))
    .resize(32, 32)
    .png()
    .toBuffer();
  // ICO is just a renamed PNG for modern browsers
  fs.copyFileSync(
    path.join(ICONS_DIR, 'favicon-32x32.png'),
    path.join(ICONS_DIR, 'favicon.ico')
  );
  console.log('  ✓ favicon.ico (32x32)');

  console.log('\n═══ OG IMAGE ═══');
  await generateOGImage();

  console.log('\n╔══════════════════════════════╗');
  console.log('║     ALL ASSETS GENERATED     ║');
  console.log('╚══════════════════════════════╝\n');
}

main().catch(console.error);
