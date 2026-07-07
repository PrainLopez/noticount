import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";

import type { CurrencyType } from "@/src/db/schema";

import { db } from "@/src/db/client";
import { accountRecords, recordTypeValues } from "@/src/db/schema";

import { getLatestBudgetsPerCurrency, hasAnyBudget } from "./budget";
import { getCurrentMonthKey, getMonthRangeLocal } from "./dates";
import { getRecentRecordsPaginated } from "./records";

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

function decimalToString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "0";
  }
  return typeof value === "string" ? value : String(value);
}

function divideStrings(numerator: string, denominator: string): string {
  const n = Number(numerator);
  const d = Number(denominator);
  if (d === 0) {
    return "0";
  }
  return (n / d).toFixed(4);
}

function multiplyStrings(a: string, b: string): string {
  return (Number(a) * Number(b)).toFixed(4);
}

function sumStrings(values: string[]): string {
  return values.reduce((acc, value) => (Number(acc) + Number(value)).toFixed(2), "0.00");
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const now = new Date();
  const currentMonthKey = getCurrentMonthKey(now);
  const { monthStart, nextMonthStart } = getMonthRangeLocal(now);

  const [monthlyTotals, latestBudgets, firstSetupFlag, recentPage] = await Promise.all([
    db
      .select({
        currencyType: accountRecords.currencyType,
        total: sql<string>`coalesce(sum(${accountRecords.amount}), 0)`,
      })
      .from(accountRecords)
      .where(and(
        eq(accountRecords.userId, userId),
        eq(accountRecords.recordType, recordTypeValues[0]),
        gte(accountRecords.createdAt, monthStart),
        lt(accountRecords.createdAt, nextMonthStart),
      ))
      .groupBy(accountRecords.currencyType),
    getLatestBudgetsPerCurrency(userId, currentMonthKey),
    hasAnyBudget(userId),
    getRecentRecordsPaginated(userId, 0),
  ]);

  const isFirstSetup = !firstSetupFlag;

  if (latestBudgets.length === 0) {
    return {
      currentMonthKey,
      hasBudget: false,
      isFirstSetup,
      items: [],
    };
  }

  const last7Daily = recentPage.data.filter(r => r.recordType === "daily");
  const last7TotalByCurrency: Record<string, string> = {};
  for (const record of last7Daily) {
    last7TotalByCurrency[record.currencyType] = sumStrings([
      last7TotalByCurrency[record.currencyType] ?? "0",
      record.amount,
    ]);
  }

  const monthTotalByCurrency: Record<string, string> = {};
  for (const row of monthlyTotals) {
    monthTotalByCurrency[row.currencyType] = decimalToString(row.total);
  }

  const items: UsageSummaryItem[] = latestBudgets.map((budget) => {
    const monthTotal = monthTotalByCurrency[budget.currencyType] ?? "0";
    const last7Total = last7TotalByCurrency[budget.currencyType] ?? "0";
    const avgLast7Days = divideStrings(last7Total, "7");
    const usagePercent = multiplyStrings(divideStrings(monthTotal, budget.budgetAmount), "100");

    return {
      avgLast7Days,
      budgetAmount: budget.budgetAmount,
      currencyType: budget.currencyType,
      monthTotal,
      usagePercent,
    };
  });

  return {
    currentMonthKey,
    hasBudget: true,
    isFirstSetup,
    items,
  };
}
