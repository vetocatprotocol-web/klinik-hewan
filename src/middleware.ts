import { auth } from "@/server/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  const publicRoutes = ["/login", "/api/auth", "/api/health"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any)?.role;

  // Portal routes - customers only
  if (pathname.startsWith("/portal")) {
    // Allow all authenticated users to access portal for now
    // In production, check role === "CUSTOMER"
    return NextResponse.next();
  }

  // Dashboard routes - staff only
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/customers") ||
      pathname.startsWith("/visits") || pathname.startsWith("/billings") ||
      pathname.startsWith("/pos") || pathname.startsWith("/invoices") ||
      pathname.startsWith("/master") || pathname.startsWith("/reports") ||
      pathname.startsWith("/settings")) {

    // Owner-only routes
    const ownerOnlyRoutes = ["/master", "/settings", "/reports"];
    if (ownerOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (role !== "OWNER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // POS - Owner, Kasir only
    if (pathname.startsWith("/pos")) {
      if (role !== "OWNER" && role !== "KASIR") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
