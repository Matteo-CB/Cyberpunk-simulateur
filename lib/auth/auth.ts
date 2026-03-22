import NextAuth from 'next-auth';
import { authOptions } from './authOptions';

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

export async function getSession() {
  const session = await auth();
  return session;
}

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session as any)?.userId || null;
}

export async function getUsername(): Promise<string | null> {
  const session = await auth();
  return (session as any)?.username || null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const username = (session as any)?.username;
  const { ADMIN_USERNAMES } = await import('./authOptions');
  return ADMIN_USERNAMES.includes(username);
}
