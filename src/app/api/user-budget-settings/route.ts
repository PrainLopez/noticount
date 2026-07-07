import { NextResponse } from "next/server";
import { z } from "zod";

import { currencyTypeValues } from "@/src/db/schema";
import { requireAuthSnapshot } from "@/src/server/_auth";
import { insertBudgetSetting } from "@/src/server/budget";
import { getCurrentMonthKey } from "@/src/server/dates";

export const dynamic = "force-dynamic";

function createInsertSchema(currentMonthKey: number) {
  return z.object({
    budgetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Budget must be a numeric string with up to 2 decimals"),
    currencyType: z.enum(currencyTypeValues),
    timeToEffect: z
      .number()
      .int()
      .min(currentMonthKey, "Month cannot be earlier than current month")
      .max(999912, "Invalid month")
      .refine((value) => {
        const month = value % 100;
        return month >= 1 && month <= 12;
      }, "Month must be between 01 and 12"),
  });
}

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
  const parsed = createInsertSchema(getCurrentMonthKey()).safeParse(body);
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
