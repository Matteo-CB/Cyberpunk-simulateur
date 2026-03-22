import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/user/link-discord/callback`
  : 'http://localhost:3000/api/user/link-discord/callback';

const SCOPES = 'identify email guilds.join';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface StatePayload {
  userId: string;
  timestamp: number;
}

function createStateToken(userId: string): string {
  const payload: StatePayload = {
    userId,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = (session as any).userId as string;

    // Check if user already has a Discord account linked
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.discordId) {
      return NextResponse.json(
        { error: 'Discord account already linked' },
        { status: 409 }
      );
    }

    // Generate state token with userId and timestamp
    const state = createStateToken(userId);

    // Build Discord OAuth2 authorization URL
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      state,
      prompt: 'consent',
    });

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error('[link-discord] Error initiating Discord OAuth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
