import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_USERNAMES } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const username = (session as any).username;
    if (!ADMIN_USERNAMES.includes(username)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const bannedCards = await prisma.bannedCard.findMany({
      orderBy: { bannedAt: 'desc' },
    });

    return NextResponse.json(bannedCards);
  } catch (error) {
    console.error('Error fetching banned cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const username = (session as any).username;
    if (!ADMIN_USERNAMES.includes(username)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { cardId } = await req.json();

    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    // Check if already banned
    const existing = await prisma.bannedCard.findUnique({ where: { cardId } });
    if (existing) {
      return NextResponse.json({ error: 'Card is already banned' }, { status: 400 });
    }

    const banned = await prisma.bannedCard.create({
      data: { cardId },
    });

    return NextResponse.json(banned, { status: 201 });
  } catch (error) {
    console.error('Error banning card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
