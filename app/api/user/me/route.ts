import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session as any).userId },
    select: {
      id: true, username: true, email: true, elo: true,
      wins: true, losses: true, draws: true,
      discordId: true, discordUsername: true, role: true,
      badgePrefs: true, animationsEnabled: true, gameBackground: true,
      chatBanned: true, gameBanned: true, createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const safeUser = {
    ...user,
    placementCompleted: (user as any).placementCompleted ?? false,
    gamesPlayed: (user as any).gamesPlayed ?? 0,
  };

  return NextResponse.json(safeUser);
}
