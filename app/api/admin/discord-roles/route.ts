import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_USERNAMES } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

const DISCORD_ROLES_KEY = 'discord_roles';

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

    const settings = await prisma.siteSettings.findUnique({
      where: { key: DISCORD_ROLES_KEY },
    });

    return NextResponse.json({
      roleMapping: settings?.discordRoleIds || {},
    });
  } catch (error) {
    console.error('Error fetching discord roles:', error);
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

    const { roles } = await req.json();

    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json({ error: 'roles array is required' }, { status: 400 });
    }

    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
      return NextResponse.json({ error: 'Discord bot configuration missing' }, { status: 500 });
    }

    const createdRoles: Record<string, string> = {};

    for (const role of roles) {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: role.name,
            color: role.color ? parseInt(role.color.replace('#', ''), 16) : 0,
            permissions: '0',
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error(`Failed to create Discord role ${role.name}:`, err);
        continue;
      }

      const created = await res.json();
      createdRoles[role.key] = created.id;
    }

    // Save the mapping
    await prisma.siteSettings.upsert({
      where: { key: DISCORD_ROLES_KEY },
      update: { discordRoleIds: createdRoles },
      create: { key: DISCORD_ROLES_KEY, discordRoleIds: createdRoles },
    });

    return NextResponse.json({ createdRoles }, { status: 201 });
  } catch (error) {
    console.error('Error creating discord roles:', error);
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

    const { roleMapping } = await req.json();

    if (!roleMapping || typeof roleMapping !== 'object') {
      return NextResponse.json({ error: 'roleMapping object is required' }, { status: 400 });
    }

    await prisma.siteSettings.upsert({
      where: { key: DISCORD_ROLES_KEY },
      update: { discordRoleIds: roleMapping },
      create: { key: DISCORD_ROLES_KEY, discordRoleIds: roleMapping },
    });

    return NextResponse.json({ roleMapping });
  } catch (error) {
    console.error('Error updating discord role mapping:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
