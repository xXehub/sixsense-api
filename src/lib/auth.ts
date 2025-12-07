import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { supabase } from './supabase';

// Discord OAuth Scopes
const scopes = ['identify', 'email', 'guilds'].join(' ');

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: scopes } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'discord' && profile) {
        try {
          // Check/create user in database
          const discordProfile = profile as {
            id: string;
            username: string;
            avatar?: string;
            email?: string;
          };

          // Upsert user in Supabase
          const { error } = await supabase
            .from('users')
            .upsert(
              {
                discord_id: discordProfile.id,
                discord_username: discordProfile.username,
                discord_avatar: discordProfile.avatar 
                  ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
                  : null,
              },
              { onConflict: 'discord_id' }
            );

          if (error) {
            console.error('Error upserting user:', error);
          }
        } catch (err) {
          console.error('SignIn callback error:', err);
        }
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      // On initial sign in, add Discord ID to token
      if (account && profile) {
        const discordProfile = profile as { id: string; username: string; avatar?: string };
        token.id = discordProfile.id;
        token.discordId = discordProfile.id;
        token.username = discordProfile.username;
        token.avatar = discordProfile.avatar
          ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
          : null;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        (session.user as any).id = token.id || token.discordId;
        (session.user as any).discordId = token.discordId;
        (session.user as any).username = token.username;
        (session.user as any).avatar = token.avatar;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
