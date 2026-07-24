import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/dashboard",
        headers: [
          { key: "Cache-Control", value: "private, max-age=5, stale-while-revalidate=15" },
        ],
      },
      {
        source: "/portal/dashboard",
        headers: [
          { key: "Cache-Control", value: "private, max-age=5, stale-while-revalidate=15" },
        ],
      },
      {
        source: "/api/auth/session",
        headers: [
          { key: "Cache-Control", value: "private, max-age=30, stale-while-revalidate=60" },
        ],
      },
    ];
  },
};

export default nextConfig;
