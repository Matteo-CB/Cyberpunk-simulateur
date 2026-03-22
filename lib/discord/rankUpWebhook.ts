import { RANK_TIERS, type RankTier } from './roleSync';

const WEBHOOK_URL = process.env.DISCORD_RANK_WEBHOOK_URL;

/**
 * Rank tier symbols used in Discord notifications.
 * Maps tier keys to their display symbols.
 */
const TIER_SYMBOLS: Record<string, string> = {
  unranked: '',
  streetkid: '◦',
  edgerunner: '◈',
  solo: '◆',
  netrunner: '✦',
  fixer: '⚡',
  afterlife_regular: '◉',
  night_city_legend: '★',
  cyberpunk: '♦',
};

/**
 * Convert a hex color string to a decimal integer for Discord embeds.
 */
function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Get a motivational flavor text based on the rank tier.
 */
function getFlavorText(tierKey: string): string {
  const flavors: Record<string, string> = {
    streetkid: 'Just stepped onto the streets of Night City.',
    edgerunner: 'Starting to make a name on the edge.',
    solo: 'A reliable operator for any gig.',
    netrunner: 'Diving deep into the NET.',
    fixer: 'The one who makes things happen.',
    afterlife_regular: 'A regular at the Afterlife bar.',
    night_city_legend: 'A legend whispered across Night City.',
    cyberpunk: 'The ultimate cyberpunk. Night City bows.',
  };
  return flavors[tierKey] || 'Rank updated.';
}

/**
 * Build a Discord webhook embed for a rank-up notification.
 */
function buildRankUpEmbed(
  username: string,
  tier: RankTier,
  newElo: number,
  previousTierKey?: string
) {
  const symbol = TIER_SYMBOLS[tier.key] || '';
  const flavorText = getFlavorText(tier.key);

  const fields = [
    {
      name: 'New Rank',
      value: `${symbol} **${tier.name}** ${symbol}`,
      inline: true,
    },
    {
      name: 'ELO',
      value: `\`${newElo}\``,
      inline: true,
    },
  ];

  if (previousTierKey) {
    const previousTier = RANK_TIERS.find((t) => t.key === previousTierKey);
    if (previousTier) {
      const prevSymbol = TIER_SYMBOLS[previousTier.key] || '';
      fields.push({
        name: 'Previous Rank',
        value: `${prevSymbol} ${previousTier.name}`,
        inline: true,
      });
    }
  }

  return {
    title: `${symbol} Rank Up! ${symbol}`,
    description: `**${username}** ranked up to **${tier.name}** ${symbol}\n\n*${flavorText}*`,
    color: hexToDecimal(tier.color),
    fields,
    thumbnail: {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cyberpunk-tcg.com'}/images/ranks/${tier.key}.png`,
    },
    footer: {
      text: 'Cyberpunk TCG Simulator',
      icon_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cyberpunk-tcg.com'}/images/logo-small.png`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send a rank-up notification to the configured Discord webhook.
 *
 * @param discordId - The user's Discord snowflake ID (used for mention)
 * @param username - The user's display name
 * @param tier - The new rank tier achieved
 * @param newElo - The user's current ELO rating
 * @param previousTierKey - Optional key of the previous rank tier
 * @returns true if the webhook was sent successfully, false otherwise
 */
export async function sendRankUpWebhook(
  discordId: string | null,
  username: string,
  tier: RankTier,
  newElo: number,
  previousTierKey?: string
): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn('[rankUpWebhook] DISCORD_RANK_WEBHOOK_URL not configured');
    return false;
  }

  try {
    const symbol = TIER_SYMBOLS[tier.key] || '';
    const mention = discordId ? `<@${discordId}>` : `**${username}**`;

    const payload = {
      content: `${mention} ranked up to **${tier.name}** ${symbol}`,
      embeds: [buildRankUpEmbed(username, tier, newElo, previousTierKey)],
      allowed_mentions: {
        users: discordId ? [discordId] : [],
      },
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[rankUpWebhook] Failed to send webhook: ${response.status} ${errorText}`
      );
      return false;
    }

    // Handle rate limits for webhooks
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 2000;
      console.warn(`[rankUpWebhook] Rate limited, retrying after ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return sendRankUpWebhook(discordId, username, tier, newElo, previousTierKey);
    }

    console.log(
      `[rankUpWebhook] Rank-up notification sent: ${username} -> ${tier.name}`
    );
    return true;
  } catch (error) {
    console.error('[rankUpWebhook] Error sending webhook:', error);
    return false;
  }
}

/**
 * Send a rank-down notification (optional, for significant drops).
 */
export async function sendRankDownWebhook(
  username: string,
  tier: RankTier,
  newElo: number,
  previousTierKey: string
): Promise<boolean> {
  if (!WEBHOOK_URL) {
    return false;
  }

  try {
    const symbol = TIER_SYMBOLS[tier.key] || '';
    const previousTier = RANK_TIERS.find((t) => t.key === previousTierKey);
    const prevSymbol = previousTier ? TIER_SYMBOLS[previousTier.key] || '' : '';

    const payload = {
      embeds: [
        {
          title: 'Rank Change',
          description: `**${username}** dropped to **${tier.name}** ${symbol} (from ${previousTier?.name || previousTierKey} ${prevSymbol})`,
          color: hexToDecimal('#555555'),
          fields: [
            { name: 'New Rank', value: `${symbol} ${tier.name}`, inline: true },
            { name: 'ELO', value: `\`${newElo}\``, inline: true },
          ],
          footer: {
            text: 'Cyberpunk TCG Simulator',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('[rankDownWebhook] Error:', error);
    return false;
  }
}
