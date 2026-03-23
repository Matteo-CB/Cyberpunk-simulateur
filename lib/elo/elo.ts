const MIN_ELO = 100;

export function calculateElo(
  playerElo: number,
  opponentElo: number,
  result: 'win' | 'loss' | 'draw'
): { newElo: number; change: number } {
  const K = playerElo < 2000 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = result === 'win' ? 1.0 : result === 'draw' ? 0.5 : 0.0;
  const change = Math.round(K * (actual - expected));
  const newElo = Math.max(MIN_ELO, playerElo + change);
  return { newElo, change };
}

export function getLeagueTier(elo: number): {
  key: string; name: string; minElo: number; color: string; symbol: string;
} {
  const tiers = [
    { key: 'cyberpunk', name: 'Cyberpunk', minElo: 2000, color: '#FFD700', symbol: '♦' },
    { key: 'night_city_legend', name: 'Night City Legend', minElo: 1600, color: '#FCAC00', symbol: '★' },
    { key: 'afterlife_regular', name: 'Afterlife Regular', minElo: 1200, color: '#FF003C', symbol: '◉' },
    { key: 'fixer', name: 'Fixer', minElo: 1000, color: '#00F0FF', symbol: '⚡' },
    { key: 'netrunner', name: 'Netrunner', minElo: 800, color: '#A855F7', symbol: '✦' },
    { key: 'solo', name: 'Solo', minElo: 550, color: '#3B82F6', symbol: '◆' },
    { key: 'edgerunner', name: 'Edgerunner', minElo: 450, color: '#22C55E', symbol: '◈' },
    { key: 'streetkid', name: 'Streetkid', minElo: 0, color: '#6B7280', symbol: '◦' },
  ];
  for (const tier of tiers) {
    if (elo >= tier.minElo) return tier;
  }
  return tiers[tiers.length - 1];
}

export const UNRANKED_TIER = { key: 'unranked', name: 'Unranked', color: '#4a4a5a', minElo: 0, symbol: '?' };

export function getLeagueTierForPlayer(elo: number, placementCompleted: boolean) {
  if (!placementCompleted) return UNRANKED_TIER;
  return getLeagueTier(elo);
}
