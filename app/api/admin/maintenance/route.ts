import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_USERNAMES } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

const MAINTENANCE_KEY = 'maintenance';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: MAINTENANCE_KEY },
    });

    const isMaintenanceMode = settings?.leaguesEnabled ?? false;
    // Using leaguesEnabled field as a maintenance flag for the maintenance key

    return NextResponse.json({
      maintenanceMode: isMaintenanceMode,
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
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

    const current = await prisma.siteSettings.findUnique({
      where: { key: MAINTENANCE_KEY },
    });

    const newValue = !(current?.leaguesEnabled ?? false);

    await prisma.siteSettings.upsert({
      where: { key: MAINTENANCE_KEY },
      update: { leaguesEnabled: newValue },
      create: { key: MAINTENANCE_KEY, leaguesEnabled: newValue },
    });

    return NextResponse.json({
      maintenanceMode: newValue,
      message: newValue ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
