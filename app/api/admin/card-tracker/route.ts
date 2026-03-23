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

    const issues = await prisma.cardIssue.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching card issues:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const username = (session as any).username;
    if (!ADMIN_USERNAMES.includes(username)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Card issue id is required' }, { status: 400 });
    }

    const existing = await prisma.cardIssue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Card issue not found' }, { status: 404 });
    }

    const updated = await prisma.cardIssue.update({
      where: { id },
      data: {
        status,
        updatedBy: username,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating card issue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
