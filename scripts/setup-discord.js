/**
 * Cyberpunk TCG Simulator — Discord Server Setup
 *
 * Creates all roles, categories, channels, and webhook automatically.
 * Run with: node scripts/setup-discord.js
 */

const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_DISCORD_TOKEN;
const SERVER_ID = process.env.SERVER_DISCORD_ID;

if (!BOT_TOKEN || !SERVER_ID) {
  console.error('Missing BOT_DISCORD_TOKEN or SERVER_DISCORD_ID in .env');
  process.exit(1);
}

// ═══════════════════════════════════════════
// RANK ROLES (8 tiers + Unranked)
// ═══════════════════════════════════════════
const RANK_ROLES = [
  { key: 'unranked',          name: '░ Unranked',              color: 0x555555, minElo: -1,   symbol: '░' },
  { key: 'streetkid',         name: '◦ Streetkid',             color: 0x6B7280, minElo: 0,    symbol: '◦' },
  { key: 'edgerunner',        name: '◈ Edgerunner',            color: 0x22C55E, minElo: 450,  symbol: '◈' },
  { key: 'solo',              name: '◆ Solo',                  color: 0x3B82F6, minElo: 550,  symbol: '◆' },
  { key: 'netrunner',         name: '✦ Netrunner',             color: 0xA855F7, minElo: 800,  symbol: '✦' },
  { key: 'fixer',             name: '⚡ Fixer',                color: 0x00F0FF, minElo: 1000, symbol: '⚡' },
  { key: 'afterlife_regular', name: '◉ Afterlife Regular',     color: 0xFF003C, minElo: 1200, symbol: '◉' },
  { key: 'night_city_legend', name: '★ Night City Legend',     color: 0xFCAC00, minElo: 1600, symbol: '★' },
  { key: 'cyberpunk',         name: '♦ Cyberpunk',             color: 0xFFD700, minElo: 2000, symbol: '♦' },
];

// ═══════════════════════════════════════════
// EXTRA ROLES
// ═══════════════════════════════════════════
const EXTRA_ROLES = [
  { name: '── RANKS ──',         color: 0x2B2D31, position: 'separator' },
  { name: 'Tournament Winner',   color: 0xFFD700 },
  { name: 'Tournament Player',   color: 0x00F0FF },
  { name: 'Alpha Tester',        color: 0xFF003C },
  { name: 'Crew Member',         color: 0x3B82F6 },
];

// ═══════════════════════════════════════════
// CHANNELS STRUCTURE
// ═══════════════════════════════════════════
const CATEGORIES = [
  {
    name: '═══ WELCOME ═══',
    channels: [
      { name: '📋┃rules',           type: ChannelType.GuildText },
      { name: '📢┃announcements',   type: ChannelType.GuildText },
      { name: '🔗┃link-account',    type: ChannelType.GuildText },
    ],
  },
  {
    name: '═══ GENERAL ═══',
    channels: [
      { name: '💬┃general',         type: ChannelType.GuildText },
      { name: '🃏┃deck-discussion', type: ChannelType.GuildText },
      { name: '📊┃meta-talk',       type: ChannelType.GuildText },
      { name: '🖼┃card-showcase',   type: ChannelType.GuildText },
    ],
  },
  {
    name: '═══ COMPETITIVE ═══',
    channels: [
      { name: '🏆┃rank-up',         type: ChannelType.GuildText, isWebhook: true },
      { name: '🎮┃find-match',      type: ChannelType.GuildText },
      { name: '🏅┃tournaments',     type: ChannelType.GuildText },
      { name: '📈┃leaderboard',     type: ChannelType.GuildText },
    ],
  },
  {
    name: '═══ COMMUNITY ═══',
    channels: [
      { name: '💡┃suggestions',     type: ChannelType.GuildText },
      { name: '🐛┃bug-reports',     type: ChannelType.GuildText },
      { name: '🎨┃fan-art',         type: ChannelType.GuildText },
    ],
  },
  {
    name: '═══ VOICE ═══',
    channels: [
      { name: '🔊┃Night City Lounge',  type: ChannelType.GuildVoice },
      { name: '🔊┃Afterlife VIP',      type: ChannelType.GuildVoice },
    ],
  },
];

// ═══════════════════════════════════════════
// MAIN SETUP
// ═══════════════════════════════════════════

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.once('ready', async () => {
  console.log(`\n⚡ Bot connected as ${client.user.tag}\n`);

  const guild = await client.guilds.fetch(SERVER_ID);
  if (!guild) {
    console.error('Server not found. Check SERVER_DISCORD_ID.');
    process.exit(1);
  }

  console.log(`📡 Server: ${guild.name} (${guild.memberCount} members)\n`);

  // ─── Step 1: Create Rank Roles ───
  console.log('═══ CREATING RANK ROLES ═══');
  const roleIdMap = {};

  // Create separator role first (highest position for ranks section)
  const separatorRole = EXTRA_ROLES.find(r => r.position === 'separator');
  const existingSep = guild.roles.cache.find(r => r.name === separatorRole.name);
  if (existingSep) {
    console.log(`  ↳ "${separatorRole.name}" already exists`);
  } else {
    await guild.roles.create({
      name: separatorRole.name,
      color: separatorRole.color,
      hoist: true,
      mentionable: false,
      permissions: '0',
    });
    console.log(`  ✓ Created separator: "${separatorRole.name}"`);
  }

  // Create rank roles (reverse order so highest rank = highest position)
  for (const rank of [...RANK_ROLES].reverse()) {
    const existing = guild.roles.cache.find(r => r.name === rank.name);
    if (existing) {
      roleIdMap[rank.key] = existing.id;
      console.log(`  ↳ "${rank.name}" already exists (${existing.id})`);
      continue;
    }

    const role = await guild.roles.create({
      name: rank.name,
      color: rank.color,
      hoist: true,
      mentionable: false,
      permissions: '0',
    });
    roleIdMap[rank.key] = role.id;
    console.log(`  ✓ Created: "${rank.name}" (${role.id}) — color: #${rank.color.toString(16).padStart(6, '0')}`);
    await sleep(300);
  }

  // Create extra roles
  console.log('\n═══ CREATING EXTRA ROLES ═══');
  for (const extra of EXTRA_ROLES) {
    if (extra.position === 'separator') continue;
    const existing = guild.roles.cache.find(r => r.name === extra.name);
    if (existing) {
      console.log(`  ↳ "${extra.name}" already exists`);
      continue;
    }
    await guild.roles.create({
      name: extra.name,
      color: extra.color,
      hoist: false,
      mentionable: false,
      permissions: '0',
    });
    console.log(`  ✓ Created: "${extra.name}"`);
    await sleep(300);
  }

  // ─── Step 2: Create Channels ───
  console.log('\n═══ CREATING CHANNELS ═══');
  let webhookUrl = null;

  for (const category of CATEGORIES) {
    // Check if category exists
    let cat = guild.channels.cache.find(
      c => c.name === category.name && c.type === ChannelType.GuildCategory
    );
    if (!cat) {
      cat = await guild.channels.create({
        name: category.name,
        type: ChannelType.GuildCategory,
      });
      console.log(`\n  📁 Category: "${category.name}"`);
    } else {
      console.log(`\n  📁 Category: "${category.name}" (exists)`);
    }

    for (const ch of category.channels) {
      const existing = guild.channels.cache.find(
        c => c.name === ch.name && c.parentId === cat.id
      );
      if (existing) {
        console.log(`     ↳ #${ch.name} already exists`);
        // If this is the webhook channel and we need the webhook
        if (ch.isWebhook && !process.env.DISCORD_RANKUP_WEBHOOK_URL) {
          const webhooks = await existing.fetchWebhooks();
          const existingWh = webhooks.find(w => w.name === 'Cyberpunk TCG Rank-Up');
          if (existingWh) {
            webhookUrl = existingWh.url;
            console.log(`     ↳ Webhook already exists: ${webhookUrl.slice(0, 60)}...`);
          }
        }
        continue;
      }

      const channel = await guild.channels.create({
        name: ch.name,
        type: ch.type,
        parent: cat.id,
      });
      console.log(`     ✓ #${ch.name}`);

      // Create webhook for rank-up channel
      if (ch.isWebhook) {
        const webhook = await channel.createWebhook({
          name: 'Cyberpunk TCG Rank-Up',
          reason: 'Auto-created by Cyberpunk TCG setup script',
        });
        webhookUrl = webhook.url;
        console.log(`     ⚡ Webhook created: ${webhookUrl.slice(0, 60)}...`);
      }

      await sleep(300);
    }
  }

  // ─── Step 3: Send Welcome Embed ───
  console.log('\n═══ SENDING WELCOME MESSAGE ═══');
  const rulesChannel = guild.channels.cache.find(c => c.name === '📋┃rules');
  if (rulesChannel) {
    const embed = new EmbedBuilder()
      .setTitle('⚡ CYBERPUNK TCG SIMULATOR')
      .setDescription(
        '```\n' +
        '╔══════════════════════════════════════╗\n' +
        '║   WELCOME TO NIGHT CITY, CHOOMBA    ║\n' +
        '╚══════════════════════════════════════╝\n' +
        '```\n\n' +
        '**Play the Cyberpunk Trading Card Game online.**\n' +
        'Build decks, fight rivals, steal Gigs, climb the ranks.\n\n' +
        '── **RANKS** ──\n' +
        RANK_ROLES.filter(r => r.key !== 'unranked').map(r =>
          `${r.symbol} **${r.name.replace(/^[^\s]+ /, '')}** — ${r.minElo}+ ELO`
        ).join('\n') +
        '\n\n── **RULES** ──\n' +
        '• Collect **6 Gig Dice** to win\n' +
        '• Play **Units**, equip **Gear**, deploy **Programs**\n' +
        '• **Attack** rival Units or steal their Gigs\n' +
        '• **Call Legends** to lead your crew\n\n' +
        '── **LINKS** ──\n' +
        '🔗 [Play Now](http://localhost:3000)\n' +
        '🃏 Link your account in <#link-account>'
      )
      .setColor(0x00F0FF)
      .setFooter({ text: 'Cyberpunk TCG Simulator — Fan-made, not affiliated with CD Projekt Red' })
      .setTimestamp();

    await rulesChannel.send({ embeds: [embed] });
    console.log('  ✓ Welcome embed sent to #rules');
  }

  // ─── Summary ───
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        SETUP COMPLETE                ║');
  console.log('╚══════════════════════════════════════╝\n');

  console.log('Role ID Map (add to your admin config):');
  console.log(JSON.stringify(roleIdMap, null, 2));

  if (webhookUrl) {
    console.log(`\n⚡ WEBHOOK URL (add to .env as DISCORD_RANKUP_WEBHOOK_URL):\n${webhookUrl}`);
  }

  console.log('\nDone! You can close this script.');
  client.destroy();
  process.exit(0);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(BOT_TOKEN);
