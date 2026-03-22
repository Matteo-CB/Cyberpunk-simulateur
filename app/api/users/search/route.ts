import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length === 0) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q.trim(), mode: 'insensitive' },
      },
      select: {
        id: true,
        username: true,
        elo: true,
        discordUsername: true,
      },
      take: 10,
      orderBy: { username: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
