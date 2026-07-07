import "server-only";
import { and, desc, eq, lte } from "drizzle-orm";

import type { CurrencyType } from "@/src/db/schema";

import { db } from "@/src/db/client";
import { userBudgetSettings } from "@/src/db/schema";

export type InsertBudgetInput = {
  budgetAmount: string;
  currencyType: CurrencyType;
  timeToEffect: number;
};

export async function insertBudgetSetting(
  userId: string,
  input: InsertBudgetInput,
): Promise<void> {
  await db.insert(userBudgetSettings).values({
    budgetAmount: input.budgetAmount,
    currencyType: input.currencyType,
    timeToEffect: input.timeToEffect,
    userId,
  });
}

export type LatestBudgetPerCurrency = {
  budgetAmount: string;
  currencyType: CurrencyType;
};

export async function getLatestBudgetsPerCurrency(
  userId: string,
  currentMonthKey: number,
): Promise<LatestBudgetPerCurrency[]> {
  const rows = await db
    .select({
      budgetAmount: userBudgetSettings.budgetAmount,
      currencyType: userBudgetSettings.currencyType,
      id: userBudgetSettings.id,
      timeToEffect: userBudgetSettings.timeToEffect,
    })
    .from(userBudgetSettings)
    .where(and(
      eq(userBudgetSettings.userId, userId),
      lte(userBudgetSettings.timeToEffect, currentMonthKey),
    ))
    .orderBy(desc(userBudgetSettings.timeToEffect), desc(userBudgetSettings.id));

  const seen = new Set<string>();
  const result: LatestBudgetPerCurrency[] = [];
  for (const row of rows) {
    if (seen.has(row.currencyType)) {
      continue;
    }
    seen.add(row.currencyType);
    result.push({
      budgetAmount: row.budgetAmount,
      currencyType: row.currencyType,
    });
  }
  return result;
}

export async function hasAnyBudget(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: userBudgetSettings.id })
    .from(userBudgetSettings)
    .where(eq(userBudgetSettings.userId, userId))
    .limit(1);
  return rows.length > 0;
}
