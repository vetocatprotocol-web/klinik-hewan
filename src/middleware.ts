import { auth } from "@/server/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const publicRoutes = ["/login", "/api/auth", "/api/health"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any)?.role;

  if (pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/dashboard") || pathname.startsWith("/customers") ||
    pathname.startsWith("/visits") || pathname.startsWith("/billings") ||
    pathname.startsWith("/pos") || pathname.startsWith("/invoices") ||
    pathname.startsWith("/master") || pathname.startsWith("/reports") ||
    pathname.startsWith("/settings")
  ) {
    const staffRoles = ["OWNER", "DOKTER", "KASIR", "ADMIN"];
    if (!staffRoles.includes(role)) {
      return NextResponse.redirect(new URL("/portal/dashboard", req.url));
    }

    if (pathname.startsWith("/master") || pathname.startsWith("/settings")) {
      if (role !== "OWNER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (pathname.startsWith("/settings/users") && role !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/pos") && role !== "OWNER" && role !== "KASIR") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
