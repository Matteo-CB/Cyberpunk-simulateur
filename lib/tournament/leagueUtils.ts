/**
 * League tier definitions matching ELO tiers from lib/elo/elo.ts.
 * Provides utility functions for league-based tournament filtering.
 */

export interface LeagueTier {
  key: string;
  name: string;
  minElo: number;
  color: string;
  symbol: string;
}

/**
 * All league tiers, ordered from highest to lowest.
 * Matches the tiers defined in lib/elo/elo.ts.
 */
export const tiers: LeagueTier[] = [
  { key: 'cyberpunk', name: 'Cyberpunk', minElo: 2000, color: '#FFD700', symbol: '\u2666' },           // ♦
  { key: 'night_city_legend', name: 'Night City Legend', minElo: 1600, color: '#FCAC00', symbol: '\u2605' }, // ★
  { key: 'afterlife_regular', name: 'Afterlife Regular', minElo: 1200, color: '#FF003C', symbol: '\u25C9' }, // ◉
  { key: 'fixer', name: 'Fixer', minElo: 1000, color: '#00F0FF', symbol: '\u26A1' },                   // ⚡
  { key: 'netrunner', name: 'Netrunner', minElo: 800, color: '#A855F7', symbol: '\u2726' },             // ✦
  { key: 'solo', name: 'Solo', minElo: 550, color: '#3B82F6', symbol: '\u25C6' },                      // ◆
  { key: 'edgerunner', name: 'Edgerunner', minElo: 450, color: '#22C55E', symbol: '\u25C8' },           // ◈
  { key: 'streetkid', name: 'Streetkid', minElo: 0, color: '#6B7280', symbol: '\u25E6' },              // ◦
];

/**
 * Get the league tier for a given ELO rating.
 * Returns the highest tier the player qualifies for.
 */
export function getLeague(elo: number): LeagueTier {
  for (const tier of tiers) {
    if (elo >= tier.minElo) return tier;
  }
  return tiers[tiers.length - 1];
}

/**
 * Check whether a player with the given ELO can join a tournament
 * restricted to certain league tiers.
 *
 * @param elo - The player's current ELO rating.
 * @param allowedLeagues - Array of league keys that are permitted (e.g., ['fixer', 'netrunner']).
 *                         If empty, all leagues are allowed.
 * @returns true if the player's league is in the allowed list.
 */
export function canJoinLeague(elo: number, allowedLeagues: string[]): boolean {
  // Empty list means no restriction
  if (allowedLeagues.length === 0) return true;

  const playerLeague = getLeague(elo);
  return allowedLeagues.includes(playerLeague.key);
}

/**
 * Get a tier by its key.
 */
export function getTierByKey(key: string): LeagueTier | undefined {
  return tiers.find((t) => t.key === key);
}

/**
 * Get all tier keys.
 */
export function getAllLeagueKeys(): string[] {
  return tiers.map((t) => t.key);
}

/**
 * Get the display label for a league (name + symbol).
 */
export function getLeagueLabel(elo: number): string {
  const league = getLeague(elo);
  return `${league.symbol} ${league.name}`;
}
