import { NextResponse } from "next/server";

import { requireAuthSnapshot } from "@/src/server/_auth";
import { getUsageSummary } from "@/src/server/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try {
    user = await requireAuthSnapshot();
  }
  catch (response) {
    if (response instanceof Response) {
      return response;
    }
    throw response;
  }

  const summary = await getUsageSummary(user.userId);
  return NextResponse.json(summary);
}
