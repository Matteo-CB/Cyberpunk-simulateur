import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const ADMIN_USERNAMES = ['Kutxyt', 'admin', 'Daiki0'];
export const TRACKER_USERS = ['Kutxyt', 'admin', 'Andy'];

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.username, email: user.email };
      },
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify email guilds.join' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
        }
      }
      if (account?.provider === 'discord' && account.providerAccountId) {
        const dbUser = await prisma.user.findFirst({
          where: { discordId: account.providerAccountId },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).userId = token.userId;
        (session as any).username = token.username;
        (session as any).role = token.role;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'discord') {
        const discordId = account.providerAccountId;
        let dbUser = await prisma.user.findFirst({ where: { discordId } });
        if (!dbUser) {
          const username = user.name || `user_${discordId.slice(-6)}`;
          await prisma.user.create({
            data: {
              username,
              email: user.email || `${discordId}@discord.user`,
              password: '',
              discordId,
              discordUsername: user.name || '',
            },
          });
        } else {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { discordUsername: user.name || dbUser.discordUsername },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
