import "server-only";
import type { CookieOptions } from "@supabase/ssr";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/src/env";

type CookieWrite = { name: string; value: string; options?: CookieOptions };

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet: CookieWrite[]) {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          }
          catch {
            // Called from a Server Component where cookie mutation is unavailable.
            // The middleware refreshes the session, so we silently ignore here.
          }
        },
      },
    },
  );
}
