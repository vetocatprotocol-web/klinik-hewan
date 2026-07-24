import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

async function getPrismaClient() {
  return prisma();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize called with:", { email: credentials?.email, hasPassword: !!credentials?.password });
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] No credentials provided");
          return null;
        }

        try {
          const client = await getPrismaClient();
          console.log("[AUTH] Prisma client obtained");

          const user = await client.user.findUnique({
            where: { email: credentials.email as string },
            include: { role: true },
          });

          console.log("[AUTH] User found:", !!user, user ? { email: user.email, status: user.status, role: user.role?.name } : null);

          if (!user || user.status !== "ACTIVE") return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Akun terkunci. Coba lagi dalam ${minutesLeft} menit.`);
        }

        if (user.lockedUntil && user.lockedUntil <= new Date()) {
          await client.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log("[AUTH] Password valid:", isValid);

        if (!isValid) {
          const newAttempts = user.failedLoginAttempts + 1;
          const updateData: any = { failedLoginAttempts: newAttempts };

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
          }

          await client.user.update({
            where: { id: user.id },
            data: updateData,
          });

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            throw new Error(`Akun terkunci karena ${MAX_LOGIN_ATTEMPTS} percobaan gagal. Coba lagi dalam ${LOCKOUT_DURATION_MINUTES} menit.`);
          }

          const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
          throw new Error(`Email atau password salah. Sisa percobaan: ${remaining}`);
        }

        await client.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        console.log("[AUTH] Login successful for:", user.email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          image: user.image,
        };
        } catch (error) {
          console.error("[AUTH] authorize error:", error);
          return null;
        }
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
