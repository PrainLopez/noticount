import type { MonthlySettlement } from "@/src/api/monthly-settlements";

import { supabase } from "@/lib/supabase";
import { getMonthlySettlements, upsertMonthlySettlements } from "@/src/api/monthly-settlements";
import { getRecentRecordsPaginated } from "@/src/api/recent-by-day";
import { requireSessionUserId } from "@/src/api/session-user";

type AmountRecord = {
  amount: number;
  currency_type: string;
};

type DailyExpenseRecord = AmountRecord & {
  created_at: string;
};

type BudgetSetting = {
  budget_amount: number;
  currency_type: string;
  id: number;
  time_to_effect: number;
};

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

function getMonthKey(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return year * 100 + month;
}

function getMonthStartFromKey(monthKey: number): Date {
  const year = Math.floor(monthKey / 100);
  const monthIndex = (monthKey % 100) - 1;
  return new Date(year, monthIndex, 1, 0, 0, 0, 0);
}

// 本月时间进度：今天（含）是当月第几天 / 当月总天数，本地时区
export function getMonthElapsedPercent(date: Date): number {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return (date.getDate() / daysInMonth) * 100;
}

function toMapByCurrency(records: AmountRecord[]): Record<string, number> {
  return records.reduce((acc, record) => {
    if (!acc[record.currency_type]) {
      acc[record.currency_type] = 0;
    }
    acc[record.currency_type] += record.amount;
    return acc;
  }, {} as Record<string, number>);
}

function toMonthBucketsByCurrency(records: DailyExpenseRecord[]): Record<string, Record<number, number>> {
  return records.reduce((acc, record) => {
    const monthKey = getMonthKey(new Date(record.created_at));
    const buckets = (acc[record.currency_type] ??= {});
    buckets[monthKey] = (buckets[monthKey] ?? 0) + record.amount;
    return acc;
  }, {} as Record<string, Record<number, number>>);
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

export function buildBudgetTimeline(budgetRows: BudgetSetting[]): Record<string, BudgetChange[]> {
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

export async function getUsageSummary(): Promise<UsageSummary> {
  const userId = await requireSessionUserId();

  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const prevMonthKey = addMonthsKey(currentMonthKey, -1);
  const monthElapsedPercent = getMonthElapsedPercent(now);

  const [
    { data: budgetData, error: budgetError },
    { data: anyBudgetData, error: anyBudgetError },
    settledRows,
    recentRecordsPage,
  ]
    = await Promise.all([
      supabase
        .from("user_budget_settings")
        .select("budget_amount, currency_type, id, time_to_effect")
        .eq("user_id", userId)
        .lte("time_to_effect", currentMonthKey)
        .order("time_to_effect", { ascending: false })
        .order("id", { ascending: false }),
      supabase
        .from("user_budget_settings")
        .select("id")
        .eq("user_id", userId)
        .limit(1),
      getMonthlySettlements(userId),
      getRecentRecordsPaginated(0, userId),
    ]);

  if (budgetError) {
    return Promise.reject(budgetError);
  }

  if (anyBudgetError) {
    return Promise.reject(anyBudgetError);
  }

  const budgetRows = (budgetData ?? []) as BudgetSetting[];
  const isFirstSetup = (anyBudgetData?.length ?? 0) === 0;

  const effectiveBudgetByCurrency = budgetRows.reduce((acc, row) => {
    if (!acc[row.currency_type]) {
      acc[row.currency_type] = row.budget_amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const budgetCurrencies = Object.keys(effectiveBudgetByCurrency);

  if (budgetCurrencies.length === 0) {
    return {
      currentMonthKey,
      hasBudget: false,
      isFirstSetup,
      items: [],
      monthElapsedPercent,
    };
  }

  const budgetTimeline = buildBudgetTimeline(budgetRows);
  const settledMonthKeys = settledRows.reduce((acc, row) => {
    (acc[row.currency_type] ??= []).push(row.month_key);
    return acc;
  }, {} as Record<string, number[]>);
  const pendingByCurrency = planPendingSettlements({ budgetTimeline, currentMonthKey, settledMonthKeys });

  // 单条明细查询覆盖「待结算月 + 上月 + 本月」，本地时区分桶
  const earliestPendingMonthKey = Math.min(prevMonthKey, ...Object.values(pendingByCurrency).flat());
  const detailStart = getMonthStartFromKey(earliestPendingMonthKey);
  const detailEnd = getMonthStartFromKey(addMonthsKey(currentMonthKey, 1));

  const { data: detailData, error: detailError } = await supabase
    .from("account_records")
    .select("amount, created_at, currency_type")
    .eq("user_id", userId)
    .eq("record_type", "daily")
    .gte("created_at", detailStart.toISOString())
    .lt("created_at", detailEnd.toISOString());

  if (detailError) {
    return Promise.reject(detailError);
  }

  const spendByCurrencyMonth = toMonthBucketsByCurrency((detailData ?? []) as DailyExpenseRecord[]);

  // 惰性结算：归档行幂等 upsert，靠 (user_id, currency_type, month_key) 唯一约束去重
  const newSettlementRows = buildSettlementRows({ budgetTimeline, pendingByCurrency, spendByCurrencyMonth });
  await upsertMonthlySettlements(newSettlementRows, userId);

  // 上月按明细实时计算，构造成虚拟结算行与归档累计一起求和
  const prevMonthPending = Object.fromEntries(budgetCurrencies.map(currencyType => [currencyType, [prevMonthKey]]));
  const prevMonthRows = buildSettlementRows({
    budgetTimeline,
    pendingByCurrency: prevMonthPending,
    spendByCurrencyMonth,
  });

  const carryoverByCurrency = sumSettledDeltaByCurrency([...settledRows, ...newSettlementRows, ...prevMonthRows]);

  const last7DaysDailyRecords = recentRecordsPage.data.filter(record => record.record_type === "daily");
  const last7DaysTotalByCurrency = toMapByCurrency(last7DaysDailyRecords);

  const items = budgetCurrencies.map((currencyType) => {
    return buildUsageItem({
      avgLast7Days: (last7DaysTotalByCurrency[currencyType] ?? 0) / 7,
      budgetAmount: effectiveBudgetByCurrency[currencyType] ?? 0,
      carryover: carryoverByCurrency[currencyType] ?? 0,
      currencyType,
      monthTotal: spendByCurrencyMonth[currencyType]?.[currentMonthKey] ?? 0,
    });
  });

  return {
    currentMonthKey,
    hasBudget: true,
    isFirstSetup,
    items,
    monthElapsedPercent,
  };
}
