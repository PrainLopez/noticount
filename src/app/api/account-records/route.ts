import { NextResponse } from "next/server";
import { z } from "zod";

import { currencyTypeValues, recordTypeValues } from "@/src/db/schema";
import { requireAuthSnapshot } from "@/src/server/_auth";
import { insertAccountRecord } from "@/src/server/records";

export const dynamic = "force-dynamic";

const insertSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a numeric string with up to 2 decimals"),
  currencyType: z.enum(currencyTypeValues),
  note: z.string().max(80).nullable(),
  recordType: z.enum(recordTypeValues),
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

  await insertAccountRecord(user.userId, {
    amount: parsed.data.amount,
    currencyType: parsed.data.currencyType,
    note: parsed.data.note ?? null,
    recordType: parsed.data.recordType,
  });

  return NextResponse.json({ ok: true });
}
