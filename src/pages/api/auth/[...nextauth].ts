import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  theme: {
    colorScheme: 'auto', // ou 'dark' ou 'light'
    brandColor: '#000000',
    logo: '/logo.png',
  },
  callbacks: {
    async jwt({ token, account }) {
      // Adiciona os dados do provedor ao token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Envia o token para a sessão
      if (token.accessToken && typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});
