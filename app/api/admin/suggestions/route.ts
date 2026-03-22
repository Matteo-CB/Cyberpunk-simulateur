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

    const suggestions = await prisma.suggestion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
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

    const { title, description, category, priority, images, audioUrl } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'title, description, and category are required' }, { status: 400 });
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        title,
        description,
        category,
        priority: priority || 'normal',
        images: images || [],
        audioUrl: audioUrl || null,
        submittedBy: username,
      },
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('Error creating suggestion:', error);
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

    const { id, status, adminNotes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Suggestion id is required' }, { status: 400 });
    }

    const existing = await prisma.suggestion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updated = await prisma.suggestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating suggestion:', error);
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
      return NextResponse.json({ error: 'Suggestion id is required' }, { status: 400 });
    }

    const existing = await prisma.suggestion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    await prisma.suggestion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
