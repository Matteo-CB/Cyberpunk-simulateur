import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { ADMIN_USERNAMES } from '@/lib/auth/authOptions';
import { syncAllDiscordRoles } from '@/lib/discord/roleSync';

export async function POST() {
  const session = await auth();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const username = (session as any).username;
  if (!ADMIN_USERNAMES.includes(username)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const result = await syncAllDiscordRoles();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
