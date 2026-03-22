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

    const settings = await prisma.siteSettings.findMany();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const username = (session as any).username;
    if (!ADMIN_USERNAMES.includes(username)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { key, leaguesEnabled, sealedEnabled, discordRoleIds } = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Settings key is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (leaguesEnabled !== undefined) updateData.leaguesEnabled = leaguesEnabled;
    if (sealedEnabled !== undefined) updateData.sealedEnabled = sealedEnabled;
    if (discordRoleIds !== undefined) updateData.discordRoleIds = discordRoleIds;

    const settings = await prisma.siteSettings.upsert({
      where: { key },
      update: updateData,
      create: {
        key,
        leaguesEnabled: leaguesEnabled ?? false,
        sealedEnabled: sealedEnabled ?? false,
        discordRoleIds: discordRoleIds ?? null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
