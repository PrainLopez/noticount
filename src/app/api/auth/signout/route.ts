import "server-only";
import { NextResponse } from "next/server";

import { getServerSupabase } from "@/src/server/_supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
