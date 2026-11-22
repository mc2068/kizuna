import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isGoogleEnabled, resetProviderCacheForTests } from "./providers";

const env = { ...process.env };

describe("isGoogleEnabled", () => {
  beforeEach(() => {
    resetProviderCacheForTests();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ref.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("is false without Supabase", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(await isGoogleEnabled()).toBe(false);
  });

  it("reads the project auth settings", async () => {
    const fetchMock = vi.fn(async () => Response.json({ external: { google: true, email: true } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await isGoogleEnabled()).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ref.supabase.co/auth/v1/settings",
      expect.objectContaining({ headers: { apikey: "anon" } }),
    );
  });

  it("is false when Google is off, and caches the answer", async () => {
    const fetchMock = vi.fn(async () => Response.json({ external: { google: false } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await isGoogleEnabled()).toBe(false);
    expect(await isGoogleEnabled()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the button when the settings cannot be read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await isGoogleEnabled()).toBe(true);
  });
});
