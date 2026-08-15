import { z } from "zod";

import { db } from "@/src/db";
import { userBudgetSettings } from "@/src/db/schema";
import { errorResponse, requireSessionUserId } from "@/src/server/session";

const budgetSchema = z.object({
  budget_amount: z.number().min(0.01).max(9999999999.99),
  currency_type: z.string().length(3),
  time_to_effect: z.number().int().min(197001).max(999912).refine((value) => {
    const month = value % 100;
    return month >= 1 && month <= 12;
  }),
});

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId(request.headers);

    const body = budgetSchema.parse(await request.json());

    await db.insert(userBudgetSettings).values({ ...body, user_id: userId });

    return Response.json({ ok: true });
  }
  catch (error) {
    return errorResponse(error);
  }
}
