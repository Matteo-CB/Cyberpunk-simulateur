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
    const q = searchParams.get('q');

    const where: Record<string, unknown> = {};
    if (q) {
      where.username = { contains: q, mode: 'insensitive' };
    }

    const players = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        elo: true,
        wins: true,
        losses: true,
        draws: true,
        role: true,
        chatBanned: true,
        gameBanned: true,
        chatBanUntil: true,
        gameBanUntil: true,
        discordUsername: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { username: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error searching players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminUsername = (session as any).username;
    if (!ADMIN_USERNAMES.includes(adminUsername)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { userId, type, reason, permanent, expiresAt } = await req.json();

    if (!userId || !type || !reason) {
      return NextResponse.json({ error: 'userId, type, and reason are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine ban fields based on type
    const updateData: Record<string, unknown> = {};
    if (type === 'chat') {
      updateData.chatBanned = true;
      updateData.chatBanUntil = permanent ? null : expiresAt ? new Date(expiresAt) : null;
    } else if (type === 'game') {
      updateData.gameBanned = true;
      updateData.gameBanUntil = permanent ? null : expiresAt ? new Date(expiresAt) : null;
    } else if (type === 'unban_chat') {
      updateData.chatBanned = false;
      updateData.chatBanUntil = null;
    } else if (type === 'unban_game') {
      updateData.gameBanned = false;
      updateData.gameBanUntil = null;
    } else {
      return NextResponse.json({ error: 'Invalid ban type. Use: chat, game, unban_chat, unban_game' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log the ban action
    if (!type.startsWith('unban_')) {
      await prisma.userBan.create({
        data: {
          userId,
          username: user.username,
          type: type === 'chat' ? 'chat' : 'game',
          permanent: permanent || false,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          reason,
          issuedBy: adminUsername,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error managing player ban:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
