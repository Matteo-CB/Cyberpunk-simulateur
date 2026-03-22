import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session as any).userId;
    const { receiverId, roomCode } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }

    if (receiverId === userId) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for existing pending invite
    const existing = await prisma.matchInvite.findFirst({
      where: {
        senderId: userId,
        receiverId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Invite already pending' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const invite = await prisma.matchInvite.create({
      data: {
        senderId: userId,
        receiverId,
        roomCode: roomCode || null,
        status: 'pending',
        expiresAt,
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error('Error sending match invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
