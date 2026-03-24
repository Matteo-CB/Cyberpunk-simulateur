import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncDiscordRole } from '@/lib/discord/roleSync';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/user/link-discord/callback`
  : 'http://localhost:3000/api/user/link-discord/callback';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface StatePayload {
  userId: string;
  timestamp: number;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

function parseStateToken(state: string): StatePayload | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const payload = JSON.parse(decoded) as StatePayload;
    if (!payload.userId || !payload.timestamp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial or Discord error
  if (error) {
    console.error('[link-discord/callback] Discord OAuth error:', error);
    return NextResponse.redirect(
      `${APP_URL}?discord=error&reason=${encodeURIComponent(error)}`
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}?discord=error&reason=missing_params`
    );
  }

  // Parse and validate state token
  const statePayload = parseStateToken(state);
  if (!statePayload) {
    return NextResponse.redirect(
      `${APP_URL}?discord=error&reason=invalid_state`
    );
  }

  // Check state token expiry (10 minute window)
  const elapsed = Date.now() - statePayload.timestamp;
  if (elapsed > STATE_TTL_MS) {
    return NextResponse.redirect(
      `${APP_URL}?discord=error&reason=expired_state`
    );
  }

  const { userId } = statePayload;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('[link-discord/callback] Token exchange failed:', errorBody);
      return NextResponse.redirect(
        `${APP_URL}?discord=error&reason=token_exchange_failed`
      );
    }

    const tokenData: DiscordTokenResponse = await tokenResponse.json();

    // Fetch Discord user profile
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('[link-discord/callback] Failed to fetch Discord user');
      return NextResponse.redirect(
        `${APP_URL}?discord=error&reason=fetch_user_failed`
      );
    }

    const discordUser: DiscordUser = await userResponse.json();

    // Check if this Discord account is already linked to another user
    const existingLink = await prisma.user.findFirst({
      where: {
        discordId: discordUser.id,
        NOT: { id: userId },
      },
      select: { id: true, username: true },
    });

    if (existingLink) {
      return NextResponse.redirect(
        `${APP_URL}?discord=error&reason=already_linked_other`
      );
    }

    // Determine display username
    const discordDisplayName =
      discordUser.global_name || discordUser.username;

    // Update user with Discord info
    await prisma.user.update({
      where: { id: userId },
      data: {
        discordId: discordUser.id,
        discordUsername: discordDisplayName,
      },
    });

    // Sync Discord role based on current ELO
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { elo: true, placementCompleted: true },
    });
    if (userData) {
      try {
        await syncDiscordRole(discordUser.id, userData.elo, userData.placementCompleted ?? false);
      } catch (e) {
        console.error('[link-discord/callback] Role sync error:', e);
      }
    }

    // Create Account record for the discord provider link
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'discord',
          providerAccountId: discordUser.id,
        },
      },
      update: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      },
      create: {
        userId,
        type: 'oauth',
        provider: 'discord',
        providerAccountId: discordUser.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      },
    });

    return NextResponse.redirect(`${APP_URL}?discord=linked`);
  } catch (error) {
    console.error('[link-discord/callback] Unexpected error:', error);
    return NextResponse.redirect(
      `${APP_URL}?discord=error&reason=internal_error`
    );
  }
}
