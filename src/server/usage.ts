import { and, desc, eq, gte, lt, lte } from "drizzle-orm";

import type { MonthlySettlement } from "@/src/api/monthly-settlements";
import type { UsageSummary } from "@/src/api/usage";

import {
  addMonthsKey,
  buildBudgetTimeline,
  buildSettlementRows,
  buildUsageItem,
  planPendingSettlements,
  sumSettledDeltaByCurrency,
} from "@/src/api/usage";
import { db } from "@/src/db";
import { accountRecords, monthlyBudgetSettlements, userBudgetSettings } from "@/src/db/schema";

type AmountRecord = {
  amount: number;
  currency_type: string;
};

type DailyExpenseRecord = AmountRecord & {
  created_at: Date;
};

// 浏览器时区以 tzOffsetMinutes（Date.getTimezoneOffset 口径，UTC 以西为正）传入；
// 服务端把时间平移成「UTC 字段 = 客户端本地字段」后再用 UTC getter 分桶
function shiftToClientTime(date: Date, tzOffsetMinutes: number): Date {
  return new Date(date.getTime() - tzOffsetMinutes * 60_000);
}

function getMonthKey(shifted: Date): number {
  return shifted.getUTCFullYear() * 100 + (shifted.getUTCMonth() + 1);
}

// 客户端本地某月 1 日 0 点对应的真实 UTC 时刻
function getMonthStartUtc(monthKey: number, tzOffsetMinutes: number): Date {
  const year = Math.floor(monthKey / 100);
  const monthIndex = (monthKey % 100) - 1;
  return new Date(Date.UTC(year, monthIndex, 1) + tzOffsetMinutes * 60_000);
}

// 本月时间进度：今天（含）是当月第几天 / 当月总天数（客户端本地时区）
function getMonthElapsedPercent(shifted: Date): number {
  const daysInMonth = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)).getUTCDate();
  return (shifted.getUTCDate() / daysInMonth) * 100;
}

function toMapByCurrency(records: AmountRecord[]): Record<string, number> {
  return records.reduce((acc, record) => {
    acc[record.currency_type] = (acc[record.currency_type] ?? 0) + record.amount;
    return acc;
  }, {} as Record<string, number>);
}

function toMonthBucketsByCurrency(
  records: DailyExpenseRecord[],
  tzOffsetMinutes: number,
): Record<string, Record<number, number>> {
  return records.reduce((acc, record) => {
    const monthKey = getMonthKey(shiftToClientTime(record.created_at, tzOffsetMinutes));
    const buckets = (acc[record.currency_type] ??= {});
    buckets[monthKey] = (buckets[monthKey] ?? 0) + record.amount;
    return acc;
  }, {} as Record<string, Record<number, number>>);
}

export async function getUsageSummaryForUser(userId: string, tzOffsetMinutes: number): Promise<UsageSummary> {
  const now = new Date();
  const shiftedNow = shiftToClientTime(now, tzOffsetMinutes);
  const currentMonthKey = getMonthKey(shiftedNow);
  const prevMonthKey = addMonthsKey(currentMonthKey, -1);
  const monthElapsedPercent = getMonthElapsedPercent(shiftedNow);

  // 最近 7 天窗口：客户端本地今天 0 点往前 6 天，到今天 23:59:59.999
  const todayStartUtcMs = Date.UTC(shiftedNow.getUTCFullYear(), shiftedNow.getUTCMonth(), shiftedNow.getUTCDate())
    + tzOffsetMinutes * 60_000;
  const last7DaysStart = new Date(todayStartUtcMs - 6 * 24 * 60 * 60 * 1000);
  const last7DaysEnd = new Date(todayStartUtcMs + 24 * 60 * 60 * 1000 - 1);

  const [budgetRows, anyBudgetRows, settledRows, last7DaysDailyRecords] = await Promise.all([
    db
      .select({
        budget_amount: userBudgetSettings.budget_amount,
        currency_type: userBudgetSettings.currency_type,
        id: userBudgetSettings.id,
        time_to_effect: userBudgetSettings.time_to_effect,
      })
      .from(userBudgetSettings)
      .where(and(
        eq(userBudgetSettings.user_id, userId),
        lte(userBudgetSettings.time_to_effect, currentMonthKey),
      ))
      .orderBy(desc(userBudgetSettings.time_to_effect), desc(userBudgetSettings.id)),
    db
      .select({ id: userBudgetSettings.id })
      .from(userBudgetSettings)
      .where(eq(userBudgetSettings.user_id, userId))
      .limit(1),
    db
      .select({
        budget_amount: monthlyBudgetSettlements.budget_amount,
        currency_type: monthlyBudgetSettlements.currency_type,
        month_key: monthlyBudgetSettlements.month_key,
        spend_amount: monthlyBudgetSettlements.spend_amount,
      })
      .from(monthlyBudgetSettlements)
      .where(eq(monthlyBudgetSettlements.user_id, userId)),
    db
      .select({
        amount: accountRecords.amount,
        currency_type: accountRecords.currency_type,
      })
      .from(accountRecords)
      .where(and(
        eq(accountRecords.user_id, userId),
        eq(accountRecords.record_type, "daily"),
        gte(accountRecords.created_at, last7DaysStart),
        lte(accountRecords.created_at, last7DaysEnd),
      )),
  ]);

  const isFirstSetup = anyBudgetRows.length === 0;

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

  // 单条明细查询覆盖「待结算月 + 上月 + 本月」，按客户端本地时区分桶
  const earliestPendingMonthKey = Math.min(prevMonthKey, ...Object.values(pendingByCurrency).flat());
  const detailStart = getMonthStartUtc(earliestPendingMonthKey, tzOffsetMinutes);
  const detailEnd = getMonthStartUtc(addMonthsKey(currentMonthKey, 1), tzOffsetMinutes);

  const detailRows = await db
    .select({
      amount: accountRecords.amount,
      created_at: accountRecords.created_at,
      currency_type: accountRecords.currency_type,
    })
    .from(accountRecords)
    .where(and(
      eq(accountRecords.user_id, userId),
      eq(accountRecords.record_type, "daily"),
      gte(accountRecords.created_at, detailStart),
      lt(accountRecords.created_at, detailEnd),
    ));

  const spendByCurrencyMonth = toMonthBucketsByCurrency(detailRows, tzOffsetMinutes);

  // 惰性结算：归档行幂等写入，靠 (user_id, currency_type, month_key) 唯一约束去重
  const newSettlementRows = buildSettlementRows({ budgetTimeline, pendingByCurrency, spendByCurrencyMonth });
  if (newSettlementRows.length > 0) {
    await db
      .insert(monthlyBudgetSettlements)
      .values(newSettlementRows.map(row => ({ ...row, user_id: userId })))
      .onConflictDoNothing({
        target: [
          monthlyBudgetSettlements.user_id,
          monthlyBudgetSettlements.currency_type,
          monthlyBudgetSettlements.month_key,
        ],
      });
  }

  // 上月按明细实时计算，构造成虚拟结算行与归档累计一起求和
  const prevMonthPending = Object.fromEntries(budgetCurrencies.map(currencyType => [currencyType, [prevMonthKey]]));
  const prevMonthRows = buildSettlementRows({
    budgetTimeline,
    pendingByCurrency: prevMonthPending,
    spendByCurrencyMonth,
  });

  const carryoverByCurrency = sumSettledDeltaByCurrency([
    ...settledRows as MonthlySettlement[],
    ...newSettlementRows,
    ...prevMonthRows,
  ]);

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
