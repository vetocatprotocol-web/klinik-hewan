export function getAuthSecret(): string {
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!authSecret) {
    return "fallback-secret-do-not-use-in-production";
  }

  return authSecret;
}
