import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getAuthSecret } from "./auth-secret";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

async function getPrismaClient() {
  return prisma();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: getAuthSecret(),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let client;
        try {
          client = await getPrismaClient();
        } catch (error) {
          console.error("[AUTH] Database connection failed:", error);
          throw new Error("Terjadi kesalahan pada server");
        }

        let user;
        try {
          user = await client.user.findUnique({
            where: { email: credentials.email as string },
            include: { role: true },
          });
        } catch (error) {
          console.error("[AUTH] Database query failed:", error);
          throw new Error("Terjadi kesalahan pada server");
        }

        if (!user || user.status !== "ACTIVE") {
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          console.warn(`[AUTH] Account locked: ${user.email}`);
          return null;
        }

        if (user.lockedUntil && user.lockedUntil <= new Date()) {
          await client.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        let isValid: boolean;
        try {
          isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
        } catch (error) {
          console.error("[AUTH] Password comparison failed:", error);
          throw new Error("Terjadi kesalahan pada server");
        }

        if (!isValid) {
          const newAttempts = user.failedLoginAttempts + 1;
          const updateData: Record<string, unknown> = { failedLoginAttempts: newAttempts };

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
            console.warn(`[AUTH] Account locked for ${user.email} after ${newAttempts} failed attempts`);
          }

          try {
            await client.user.update({
              where: { id: user.id },
              data: updateData,
            });
          } catch (error) {
            console.error("[AUTH] Failed to update login attempts:", error);
          }

          return null;
        }

        try {
          await client.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
          });
        } catch (error) {
          console.error("[AUTH] Failed to update last login:", error);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },
});
