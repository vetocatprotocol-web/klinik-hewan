import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/server/lib/auth.config";

const { auth } = NextAuth(authConfig);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count++;
  return record.count > limit;
}

function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

const ROLE_PREFIXES: Record<string, string[]> = {
  OWNER: [],
  DOKTER: ["/appointments", "/visits", "/customers", "/prescriptions", "/reports", "/medical-records"],
  KASIR: ["/pos", "/invoices", "/customers", "/master", "/hotel", "/suppliers", "/reconciliation"],
  CUSTOMER: ["/portal"],
};

function canAccessRoute(role: string, pathname: string): boolean {
  if (role === "OWNER") return true;

  if (pathname.startsWith("/portal")) {
    return role === "CUSTOMER";
  }

  const allowedPrefixes = ROLE_PREFIXES[role] || [];
  for (const prefix of allowedPrefixes) {
    if (pathname.startsWith(prefix)) return true;
  }

  if (pathname === "/dashboard" || pathname === "/notifications") {
    return ["OWNER", "DOKTER", "KASIR"].includes(role);
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (Date.now() - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldEntries();
    lastCleanup = Date.now();
  }

  const publicRoutes = ["/login", "/forgot-password", "/reset-password", "/api/auth", "/api/health"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0";

    if (pathname.startsWith("/api/auth") || pathname === "/login") {
      const key = getRateLimitKey(ip, "auth");
      if (isRateLimited(key, 10, 15 * 60 * 1000)) {
        return new NextResponse("Too many requests. Please try again later.", {
          status: 429,
          headers: { "Retry-After": "900" },
        });
      }
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/upload")) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0";
    const key = getRateLimitKey(ip, "upload");
    if (isRateLimited(key, 10, 60 * 1000)) {
      return new NextResponse("Too many upload requests.", { status: 429, headers: { "Retry-After": "60" } });
    }
  }

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0";
    const key = getRateLimitKey(ip, "api");
    if (isRateLimited(key, 100, 60 * 1000)) {
      return new NextResponse("Too many requests.", { status: 429, headers: { "Retry-After": "60" } });
    }
  }

  // Use NextAuth's auth() to properly decrypt and verify the session token
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;

  if (!session?.user || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessRoute(role, pathname)) {
    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
