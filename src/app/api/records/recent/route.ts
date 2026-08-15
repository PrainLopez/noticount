import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/src/db";
import { accountRecords } from "@/src/db/schema";
import { errorResponse, requireSessionUserId } from "@/src/server/session";

function parseIsoDateParam(value: string | null): Date {
  const date = new Date(value ?? "");
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date parameter: ${value}`);
  }
  return date;
}

// 时间窗口（start/end/nextStart/nextEnd）由调用方按浏览器本地时区算好后传入，
// 服务端只做区间过滤，不涉及时区换算
export async function GET(request: Request) {
  try {
    const userId = await requireSessionUserId(request.headers);

    const params = new URL(request.url).searchParams;
    const start = parseIsoDateParam(params.get("start"));
    const end = parseIsoDateParam(params.get("end"));
    const nextStart = parseIsoDateParam(params.get("nextStart"));
    const nextEnd = parseIsoDateParam(params.get("nextEnd"));

    const [data, nextRows] = await Promise.all([
      db
        .select()
        .from(accountRecords)
        .where(and(
          eq(accountRecords.user_id, userId),
          gte(accountRecords.created_at, start),
          lte(accountRecords.created_at, end),
        ))
        .orderBy(desc(accountRecords.created_at)),
      db
        .select({ id: accountRecords.id })
        .from(accountRecords)
        .where(and(
          eq(accountRecords.user_id, userId),
          gte(accountRecords.created_at, nextStart),
          lte(accountRecords.created_at, nextEnd),
        ))
        .limit(1),
    ]);

    return Response.json({ data, hasMore: nextRows.length > 0 });
  }
  catch (error) {
    return errorResponse(error);
  }
}
