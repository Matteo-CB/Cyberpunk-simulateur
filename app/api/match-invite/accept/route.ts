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
    const { inviteId } = await req.json();

    if (!inviteId) {
      return NextResponse.json({ error: 'inviteId is required' }, { status: 400 });
    }

    const invite = await prisma.matchInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.receiverId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite is no longer pending' }, { status: 400 });
    }

    if (new Date() > invite.expiresAt) {
      await prisma.matchInvite.update({
        where: { id: inviteId },
        data: { status: 'expired' },
      });
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    const updated = await prisma.matchInvite.update({
      where: { id: inviteId },
      data: { status: 'accepted' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error accepting match invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
