import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_USERNAMES } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const username = (session as any).username;
    if (!ADMIN_USERNAMES.includes(username)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        include: {
          player1: {
            select: { id: true, username: true, elo: true },
          },
          player2: {
            select: { id: true, username: true, elo: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.game.count(),
    ]);

    return NextResponse.json({ games, total });
  } catch (error) {
    console.error('Error fetching admin games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const username = (session as any).username;
    if (!ADMIN_USERNAMES.includes(username)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Game id is required' }, { status: 400 });
    }

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    await prisma.game.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
