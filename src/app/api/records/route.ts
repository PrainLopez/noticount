import { z } from "zod";

import { db } from "@/src/db";
import { accountRecords } from "@/src/db/schema";
import { errorResponse, requireSessionUserId } from "@/src/server/session";

const recordSchema = z.object({
  amount: z.number().min(0.01).max(9999999999.99),
  currency_type: z.enum(["CNY", "GBP", "USD", "EUR", "JPY"]),
  note: z.string().max(80),
  record_type: z.enum(["daily", "special"]),
});

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId(request.headers);

    const body = recordSchema.parse(await request.json());

    await db.insert(accountRecords).values({ ...body, user_id: userId });

    return Response.json({ ok: true });
  }
  catch (error) {
    return errorResponse(error);
  }
}
