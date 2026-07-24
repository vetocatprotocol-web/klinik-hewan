import { NextResponse } from "next/server";
import prisma from "@/server/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};
  let status = "healthy";

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch {
    checks.database = "disconnected";
    status = "unhealthy";
  }

  // Prisma check
  try {
    await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Setting"`;
    checks.prisma = "connected";
  } catch {
    checks.prisma = "error";
    status = "degraded";
  }

  const response = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    checks,
  };

  return NextResponse.json(response, {
    status: status === "healthy" ? 200 : status === "degraded" ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
