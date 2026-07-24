import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "./auth-secret";

/**
 * Edge-compatible NextAuth configuration.
 * This config does NOT import Prisma or any Node.js-only modules,
 * so it can be used in Edge Runtime middleware.
 */
export const authConfig = {
  trustHost: true,
  secret: getAuthSecret(),
  providers: [], // Providers are added in auth.ts
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnPublicPage = ["/login", "/forgot-password", "/reset-password"].some(
        (route) => nextUrl.pathname.startsWith(route)
      );

      if (isOnPublicPage) {
        if (isLoggedIn) {
          const role = (auth.user as any)?.role;
          const dashboard = role === "CUSTOMER" ? "/portal/dashboard" : "/dashboard";
          return Response.redirect(new URL(dashboard, nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 12 * 60 * 60,
  },
} satisfies NextAuthConfig;
