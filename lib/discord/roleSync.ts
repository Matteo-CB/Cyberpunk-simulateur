import prisma from '@/lib/prisma';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.BOT_DISCORD_TOKEN!;
const GUILD_ID = process.env.SERVER_DISCORD_ID!;

/**
 * ELO rank tiers with associated Discord role metadata.
 * Each tier has a key, display name, hex color, minimum ELO threshold, and symbol.
 */
export interface RankTier {
  key: string;
  name: string;
  color: string;
  minElo: number;
  symbol: string;
}

export const RANK_TIERS: RankTier[] = [
  { key: 'cyberpunk', name: 'Cyberpunk', color: '#FFD700', minElo: 2000, symbol: '♦' },
  { key: 'night_city_legend', name: 'Night City Legend', color: '#FCAC00', minElo: 1600, symbol: '★' },
  { key: 'afterlife_regular', name: 'Afterlife Regular', color: '#FF003C', minElo: 1200, symbol: '◉' },
  { key: 'fixer', name: 'Fixer', color: '#00F0FF', minElo: 1000, symbol: '⚡' },
  { key: 'netrunner', name: 'Netrunner', color: '#A855F7', minElo: 800, symbol: '✦' },
  { key: 'solo', name: 'Solo', color: '#3B82F6', minElo: 550, symbol: '◆' },
  { key: 'edgerunner', name: 'Edgerunner', color: '#22C55E', minElo: 450, symbol: '◈' },
  { key: 'streetkid', name: 'Streetkid', color: '#6B7280', minElo: 0, symbol: '◦' },
  { key: 'unranked', name: 'Unranked', color: '#555555', minElo: -1, symbol: '' },
];

/**
 * Determine the correct rank tier for a given ELO value.
 */
export function getRankTier(elo: number): RankTier {
  for (const tier of RANK_TIERS) {
    if (tier.key === 'unranked') continue;
    if (elo >= tier.minElo) return tier;
  }
  return RANK_TIERS[RANK_TIERS.length - 1]; // unranked
}

/**
 * Fetch ELO role IDs mapping from SiteSettings.
 * Expected format in discordRoleIds JSON:
 * { "unranked": "123...", "streetkid": "456...", "edgerunner": "789...", ... }
 */
async function getEloRoleIds(): Promise<Record<string, string>> {
  const settings = await prisma.siteSettings.findFirst({
    where: { key: 'discord' },
    select: { discordRoleIds: true },
  });

  if (!settings?.discordRoleIds) {
    throw new Error('Discord role IDs not configured in SiteSettings');
  }

  return settings.discordRoleIds as Record<string, string>;
}

/**
 * Make an authenticated request to the Discord REST API using the bot token.
 */
async function discordFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${DISCORD_API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 1000;
    console.warn(`[roleSync] Rate limited. Retrying after ${waitMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return discordFetch(endpoint, options);
  }

  return response;
}

/**
 * Get all role IDs currently assigned to a guild member.
 */
async function getMemberRoles(discordId: string): Promise<string[]> {
  const response = await discordFetch(
    `/guilds/${GUILD_ID}/members/${discordId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`[roleSync] User ${discordId} not in guild ${GUILD_ID}`);
      return [];
    }
    const errorText = await response.text();
    throw new Error(`Failed to get member roles: ${response.status} ${errorText}`);
  }

  const member = await response.json();
  return member.roles as string[];
}

/**
 * Add a role to a guild member.
 */
async function addRole(discordId: string, roleId: string): Promise<void> {
  const response = await discordFetch(
    `/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
    { method: 'PUT' }
  );

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Failed to add role ${roleId}: ${response.status} ${errorText}`);
  }
}

/**
 * Remove a role from a guild member.
 */
async function removeRole(discordId: string, roleId: string): Promise<void> {
  const response = await discordFetch(
    `/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
    { method: 'DELETE' }
  );

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Failed to remove role ${roleId}: ${response.status} ${errorText}`);
  }
}

/**
 * Sync a user's Discord role based on their current ELO.
 *
 * This will:
 * 1. Look up the correct rank tier for the user's ELO
 * 2. Fetch all ELO-related role IDs from SiteSettings
 * 3. Remove any existing ELO roles from the user
 * 4. Add the correct ELO role for their current rank
 *
 * @param discordId - The user's Discord snowflake ID
 * @param elo - The user's current ELO rating
 * @returns The rank tier that was assigned, or null if sync failed
 */
export async function syncDiscordRole(
  discordId: string,
  elo: number
): Promise<RankTier | null> {
  if (!BOT_TOKEN || !GUILD_ID) {
    console.warn('[roleSync] BOT_DISCORD_TOKEN or SERVER_DISCORD_ID not configured');
    return null;
  }

  try {
    const roleIds = await getEloRoleIds();
    const allEloRoleIds = Object.values(roleIds);

    // Get current member roles
    const currentRoles = await getMemberRoles(discordId);
    if (currentRoles.length === 0 && !(await isMemberInGuild(discordId))) {
      // User not in the guild, nothing to sync
      return null;
    }

    // Remove all existing ELO roles
    const rolesToRemove = currentRoles.filter((r) => allEloRoleIds.includes(r));
    for (const roleId of rolesToRemove) {
      await removeRole(discordId, roleId);
    }

    // Determine the correct tier
    const tier = getRankTier(elo);
    const targetRoleId = roleIds[tier.key];

    if (!targetRoleId) {
      console.warn(`[roleSync] No role ID configured for tier: ${tier.key}`);
      return tier;
    }

    // Add the correct role
    await addRole(discordId, targetRoleId);

    console.log(
      `[roleSync] Synced ${discordId}: ELO ${elo} -> ${tier.name} (role ${targetRoleId})`
    );

    return tier;
  } catch (error) {
    console.error('[roleSync] Error syncing Discord role:', error);
    return null;
  }
}

/**
 * Check if a Discord user is a member of the configured guild.
 */
async function isMemberInGuild(discordId: string): Promise<boolean> {
  const response = await discordFetch(
    `/guilds/${GUILD_ID}/members/${discordId}`
  );
  return response.ok;
}

/**
 * Sync roles for all users who have a linked Discord account.
 * Useful for batch operations like league reset.
 */
export async function syncAllDiscordRoles(): Promise<{
  synced: number;
  failed: number;
  skipped: number;
}> {
  const users = await prisma.user.findMany({
    where: {
      discordId: { not: null },
    },
    select: {
      id: true,
      discordId: true,
      elo: true,
    },
  });

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.discordId) {
      skipped++;
      continue;
    }

    try {
      const result = await syncDiscordRole(user.discordId, user.elo);
      if (result) {
        synced++;
      } else {
        skipped++;
      }
    } catch {
      failed++;
    }

    // Brief pause between users to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(
    `[roleSync] Batch sync complete: ${synced} synced, ${failed} failed, ${skipped} skipped`
  );

  return { synced, failed, skipped };
}
