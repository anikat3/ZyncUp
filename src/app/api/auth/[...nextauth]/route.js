import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.profile = profile;

        // Create Firebase credential
        const credential = GoogleAuthProvider.credential(account.id_token);
        try {
          await signInWithCredential(auth, credential);
        } catch (error) {
          console.error("Firebase authentication error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.sub;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST } 