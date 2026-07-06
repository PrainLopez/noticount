import type { CurrencyType, RecordType } from "@/src/db/schema";

export type InsertAccountRecordPayload = {
  amount: string;
  currencyType: CurrencyType;
  note: string | null;
  recordType: RecordType;
};

export async function insertAccountRecord(payload: InsertAccountRecordPayload): Promise<void> {
  const response = await fetch("/api/account-records", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Insert account record failed: ${response.status}`);
  }
}
