import type { MonthlySettlement } from "@/src/api/monthly-settlements";

import { fetchJson } from "@/src/api/fetch-json";

export type BudgetChange = {
  amount: number;
  monthKey: number;
};

export type UsageSummaryItem = {
  avgLast7Days: number;
  budgetAmount: number;
  currencyType: string;
  monthTotal: number;
  totalAvailable: number;
  usagePercent: number;
};

export type UsageSummary = {
  currentMonthKey: number;
  hasBudget: boolean;
  isFirstSetup: boolean;
  items: UsageSummaryItem[];
  monthElapsedPercent: number;
};

// 上个月始终按明细实时计算，只有上上月及更早才归档结算
const GRACE_MONTHS = 1;

// 本月时间进度：今天（含）是当月第几天 / 当月总天数，本地时区
export function getMonthElapsedPercent(date: Date): number {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return (date.getDate() / daysInMonth) * 100;
}

function getEffectiveBudget(timeline: BudgetChange[] | undefined, monthKey: number): number | undefined {
  if (!timeline) {
    return undefined;
  }

  let effective: number | undefined;
  for (const change of timeline) {
    if (change.monthKey > monthKey) {
      break;
    }
    effective = change.amount;
  }
  return effective;
}

export function addMonthsKey(monthKey: number, delta: number): number {
  const year = Math.floor(monthKey / 100);
  const monthIndex = (monthKey % 100) - 1;
  const total = year * 12 + monthIndex + delta;
  return Math.floor(total / 12) * 100 + (((total % 12) + 12) % 12) + 1;
}

export function buildBudgetTimeline(budgetRows: {
  budget_amount: number;
  currency_type: string;
  id: number;
  time_to_effect: number;
}[]): Record<string, BudgetChange[]> {
  const sorted = [...budgetRows].sort((a, b) => a.time_to_effect - b.time_to_effect || a.id - b.id);

  return sorted.reduce((acc, row) => {
    (acc[row.currency_type] ??= []).push({ amount: row.budget_amount, monthKey: row.time_to_effect });
    return acc;
  }, {} as Record<string, BudgetChange[]>);
}

export function buildSettlementRows(input: {
  budgetTimeline: Record<string, BudgetChange[]>;
  pendingByCurrency: Record<string, number[]>;
  spendByCurrencyMonth: Record<string, Record<number, number>>;
}): MonthlySettlement[] {
  const rows: MonthlySettlement[] = [];

  for (const [currencyType, monthKeys] of Object.entries(input.pendingByCurrency)) {
    for (const monthKey of monthKeys) {
      const budgetAmount = getEffectiveBudget(input.budgetTimeline[currencyType], monthKey);
      if (budgetAmount === undefined) {
        continue;
      }
      rows.push({
        budget_amount: budgetAmount,
        currency_type: currencyType,
        month_key: monthKey,
        spend_amount: input.spendByCurrencyMonth[currencyType]?.[monthKey] ?? 0,
      });
    }
  }

  return rows;
}

export function buildUsageItem(input: {
  avgLast7Days: number;
  budgetAmount: number;
  carryover: number;
  currencyType: string;
  monthTotal: number;
}): UsageSummaryItem {
  const totalAvailable = input.budgetAmount + input.carryover;
  const usagePercent = totalAvailable > 0 ? (input.monthTotal / totalAvailable) * 100 : 100;

  return {
    avgLast7Days: input.avgLast7Days,
    budgetAmount: input.budgetAmount,
    currencyType: input.currencyType,
    monthTotal: input.monthTotal,
    totalAvailable,
    usagePercent,
  };
}

export function planPendingSettlements(input: {
  budgetTimeline: Record<string, BudgetChange[]>;
  currentMonthKey: number;
  settledMonthKeys: Record<string, number[]>;
}): Record<string, number[]> {
  const settleUpTo = addMonthsKey(input.currentMonthKey, -1 - GRACE_MONTHS);
  const result: Record<string, number[]> = {};

  for (const [currencyType, timeline] of Object.entries(input.budgetTimeline)) {
    const firstMonthKey = timeline[0]?.monthKey;
    if (firstMonthKey === undefined || firstMonthKey > settleUpTo) {
      continue;
    }

    const settled = new Set(input.settledMonthKeys[currencyType] ?? []);
    const pending: number[] = [];
    for (let monthKey = firstMonthKey; monthKey <= settleUpTo; monthKey = addMonthsKey(monthKey, 1)) {
      if (!settled.has(monthKey)) {
        pending.push(monthKey);
      }
    }
    if (pending.length > 0) {
      result[currencyType] = pending;
    }
  }

  return result;
}

export function sumSettledDeltaByCurrency(rows: MonthlySettlement[]): Record<string, number> {
  return rows.reduce((acc, row) => {
    acc[row.currency_type] = (acc[row.currency_type] ?? 0) + (row.budget_amount - row.spend_amount);
    return acc;
  }, {} as Record<string, number>);
}

// 汇总计算在服务端执行（惰性结算需要写库）；tzOffset 用于按浏览器本地时区分桶
export async function getUsageSummary(): Promise<UsageSummary> {
  return fetchJson<UsageSummary>(`/api/usage/summary?tzOffset=${new Date().getTimezoneOffset()}`);
}
