import { describe, expect, it, vi } from "vitest";

import { supabase } from "@/lib/supabase";

import { requireSessionUserId } from "./session-user";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

const getSessionMock = vi.mocked(supabase.auth.getSession);

describe("requireSessionUserId", () => {
  it("resolves the user id from the current session", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    } as never);

    await expect(requireSessionUserId()).resolves.toBe("user-1");
  });

  it("rejects when there is no session", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);

    await expect(requireSessionUserId()).rejects.toThrow("User not authenticated");
  });

  it("rejects with the error returned by getSession", async () => {
    const sessionError = new Error("session fetch failed");
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: sessionError,
    } as never);

    await expect(requireSessionUserId()).rejects.toBe(sessionError);
  });
});
