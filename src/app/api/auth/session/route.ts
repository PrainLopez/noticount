import { NextResponse } from "next/server";

import { getAuthSnapshot } from "@/src/server/_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getAuthSnapshot();
  return NextResponse.json({ session: snapshot });
}
