import type { NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { env } from "@/src/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          for (const { name, value } of toSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touching getUser refreshes the session cookie when it is near expiry.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Run on every route except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
