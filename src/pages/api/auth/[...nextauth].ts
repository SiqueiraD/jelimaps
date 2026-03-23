import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (account && profile?.email) {
        try {
          const supabaseAdmin = getSupabaseAdmin();

          const { data: existingUser } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .eq('email', profile.email)
            .single();

          if (existingUser) {
            token.userId = existingUser.id;
          } else {
            const newUserId = randomUUID();
            const { error } = await supabaseAdmin.from('usuarios').insert({
              id: newUserId,
              email: profile.email,
              nome: profile.name ?? null,
            });
            if (error) {
              console.error('[NextAuth] Erro ao criar usuário no Supabase:', error.message);
            } else {
              token.userId = newUserId;
            }
          }
        } catch (err) {
          console.error('[NextAuth] Falha ao sincronizar usuário com Supabase:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.userId) session.userId = token.userId as string;
      return session;
    },
  },
};

export default NextAuth(authOptions);
