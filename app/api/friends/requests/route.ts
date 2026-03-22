import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session as any).userId;

    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        sender: {
          select: { id: true, username: true, elo: true, discordUsername: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
