import { NextResponse } from "next/server";

import { requireAuthSnapshot } from "@/src/server/_auth";
import { getRecentRecordsPaginated } from "@/src/server/records";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(0, Number.parseInt(pageParam, 10) || 0) : 0;

  const result = await getRecentRecordsPaginated(user.userId, page);
  return NextResponse.json(result);
}
