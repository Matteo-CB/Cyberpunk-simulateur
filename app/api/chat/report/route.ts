import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const reporterId = (session as any).userId;
    const { messageId, targetId, messageText, roomCode, reason } = await req.json();

    if (!messageId || !targetId || !messageText || !roomCode || !reason) {
      return NextResponse.json({ error: 'All fields are required: messageId, targetId, messageText, roomCode, reason' }, { status: 400 });
    }

    if (targetId === reporterId) {
      return NextResponse.json({ error: 'Cannot report your own message' }, { status: 400 });
    }

    // Check for duplicate report
    const existing = await prisma.chatReport.findFirst({
      where: {
        messageId,
        reporterId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reported this message' }, { status: 400 });
    }

    const report = await prisma.chatReport.create({
      data: {
        messageId,
        reporterId,
        targetId,
        messageText,
        roomCode,
        reason,
        status: 'pending',
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error reporting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
