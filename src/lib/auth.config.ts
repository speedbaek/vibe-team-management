import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [Google],
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // middleware에서 JWT 토큰의 role을 session에 매핑하기 위해 필요
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).department = token.department as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
