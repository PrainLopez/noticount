import type { CurrencyType } from "@/src/db/schema";

export type InsertBudgetSettingPayload = {
  budgetAmount: string;
  currencyType: CurrencyType;
  timeToEffect: number;
};

export async function insertBudgetSetting(payload: InsertBudgetSettingPayload): Promise<void> {
  const response = await fetch("/api/user-budget-settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Insert budget setting failed: ${response.status}`);
  }
}
