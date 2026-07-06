import { NextResponse } from "next/server";
import { z } from "zod";

import { currencyTypeValues } from "@/src/db/schema";
import { requireAuthSnapshot } from "@/src/server/_auth";
import { insertBudgetSetting } from "@/src/server/budget";

export const dynamic = "force-dynamic";

const insertSchema = z.object({
  budgetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Budget must be a numeric string with up to 2 decimals"),
  currencyType: z.enum(currencyTypeValues),
  timeToEffect: z.number().int().min(190001).max(999912),
});

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = insertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await insertBudgetSetting(user.userId, {
    budgetAmount: parsed.data.budgetAmount,
    currencyType: parsed.data.currencyType,
    timeToEffect: parsed.data.timeToEffect,
  });

  return NextResponse.json({ ok: true });
}
