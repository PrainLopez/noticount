import type { CurrencyType } from "@/src/db/schema";

export type UsageSummaryItem = {
  avgLast7Days: string;
  budgetAmount: string;
  currencyType: CurrencyType;
  monthTotal: string;
  usagePercent: string;
};

export type UsageSummary = {
  currentMonthKey: number;
  hasBudget: boolean;
  isFirstSetup: boolean;
  items: UsageSummaryItem[];
};

export async function getUsageSummary(_userId: string): Promise<UsageSummary> {
  const response = await fetch("/api/usage", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Usage summary failed: ${response.status}`);
  }

  return (await response.json()) as UsageSummary;
}
