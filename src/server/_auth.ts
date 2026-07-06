import "server-only";

import { getServerSupabase } from "./_supabase";

export type AuthUser = {
  email: string | null;
  provider: string | null;
  userId: string;
  userName: string | null;
  avatarUrl: string | null;
};

export type AuthSnapshot = AuthUser | null;

function providerFromUserMeta(meta: Record<string, unknown>): string | null {
  const candidates = ["provider", "iss"];
  for (const key of candidates) {
    const value = meta[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    avatarUrl: stringOrNull(meta.avatar_url),
    email: data.user.email ?? null,
    provider: providerFromUserMeta(meta),
    userId: data.user.id,
    userName: stringOrNull(meta.user_name) ?? stringOrNull(meta.full_name) ?? stringOrNull(meta.preferred_username),
  };
}

export async function requireAuthSnapshot(): Promise<AuthUser> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return snapshot;
}
