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

    const invites = await prisma.matchInvite.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        sender: {
          select: { id: true, username: true, elo: true },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
