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

  const userMetadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const appMetadata = (data.user.app_metadata ?? {}) as Record<string, unknown>;

  return {
    avatarUrl: stringOrNull(userMetadata.avatar_url),
    email: data.user.email ?? null,
    provider: providerFromUserMeta(appMetadata),
    userId: data.user.id,
    userName: stringOrNull(userMetadata.user_name) ?? stringOrNull(userMetadata.full_name) ?? stringOrNull(userMetadata.preferred_username),
  };
}

export async function requireAuthSnapshot(): Promise<AuthUser> {
  const snapshot = await getAuthSnapshot();
  if (!snapshot) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return snapshot;
}
