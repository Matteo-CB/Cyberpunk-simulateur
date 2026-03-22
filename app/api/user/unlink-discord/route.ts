import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = (session as any).userId as string;

    // Fetch user to validate the operation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        discordId: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check user has a Discord account linked
    if (!user.discordId) {
      return NextResponse.json(
        { error: 'No Discord account linked' },
        { status: 400 }
      );
    }

    // Prevent unlinking if user has no password (Discord-only account)
    // An empty string password means the account was created via Discord OAuth
    if (!user.password || user.password === '') {
      return NextResponse.json(
        {
          error:
            'Cannot unlink Discord from a Discord-only account. Set a password first.',
        },
        { status: 403 }
      );
    }

    // Delete Account records for discord provider
    await prisma.account.deleteMany({
      where: {
        userId,
        provider: 'discord',
      },
    });

    // Clear discordId and discordUsername from user
    await prisma.user.update({
      where: { id: userId },
      data: {
        discordId: null,
        discordUsername: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Discord unlinked' });
  } catch (error) {
    console.error('[unlink-discord] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
