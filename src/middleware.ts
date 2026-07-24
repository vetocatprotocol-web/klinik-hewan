import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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
  DOKTER: ["/visits", "/customers", "/billings", "/invoices", "/prescriptions"],
  KASIR: ["/pos", "/invoices", "/customers", "/billings"],
  ADMIN: ["/customers", "/visits", "/master/stock", "/reports"],
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
    return ["OWNER", "DOKTER", "KASIR", "ADMIN"].includes(role);
  }

  return false;
}

async function decodeToken(token: string): Promise<{ role?: string } | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-production"
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
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

  const token = request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await decodeToken(token);
  if (!payload?.role) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessRoute(payload.role, pathname)) {
    if (pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
