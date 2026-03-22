import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany();

    // Convert array to a key-value object
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = {
        leaguesEnabled: s.leaguesEnabled,
        sealedEnabled: s.sealedEnabled,
        discordRoleIds: s.discordRoleIds,
      };
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
