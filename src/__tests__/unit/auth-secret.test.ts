import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthSecret } from "@/server/lib/auth-secret";

describe("getAuthSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers AUTH_SECRET when both values are present", () => {
    vi.stubEnv("AUTH_SECRET", "auth-secret");
    vi.stubEnv("NEXTAUTH_SECRET", "nextauth-secret");

    expect(getAuthSecret()).toBe("auth-secret");
  });

  it("falls back to NEXTAUTH_SECRET when AUTH_SECRET is missing", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "nextauth-secret");
    vi.stubEnv("AUTH_SECRET", "");

    expect(getAuthSecret()).toBe("nextauth-secret");
  });
});
