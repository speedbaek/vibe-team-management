import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  events: {
    async createUser({ user }) {
      // After PrismaAdapter creates the user, update role from invitation
      if (!user.email) return;
      const invitation = await prisma.invitation.findFirst({
        where: { email: user.email, status: "ACCEPTED" },
      });
      if (invitation) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: invitation.role },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (existingUser) return true;

      const invitation = await prisma.invitation.findFirst({
        where: { email: user.email, status: "PENDING" },
      });
      if (!invitation) return "/login?error=no-invitation";

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { email: (user?.email || token.email) as string },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.department = dbUser.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).department = token.department as string | null;
      }
      return session;
    },
  },
});
