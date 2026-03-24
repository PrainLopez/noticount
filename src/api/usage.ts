import { supabase } from "@/lib/supabase";

type DailyExpenseRecord = {
  amount: number;
  created_at: string;
  currency_type: string;
};

type BudgetSetting = {
  budget_amount: number;
  currency_type: string;
  id: number;
  time_to_effect: number;
};

export type UsageSummaryItem = {
  avgLast7Days: number;
  budgetAmount: number;
  currencyType: string;
  monthTotal: number;
  usagePercent: number;
};

export type UsageSummary = {
  currentMonthKey: number;
  hasBudget: boolean;
  isFirstSetup: boolean;
  items: UsageSummaryItem[];
};

function getCurrentMonthKey(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return year * 100 + month;
}

function getMonthRangeLocal(date: Date): { monthStart: Date; nextMonthStart: Date } {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);

  return { monthStart, nextMonthStart };
}

function getLast7DaysStartLocal(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return start;
}

function toMapByCurrency(records: DailyExpenseRecord[]): Record<string, number> {
  return records.reduce((acc, record) => {
    if (!acc[record.currency_type]) {
      acc[record.currency_type] = 0;
    }
    acc[record.currency_type] += record.amount;
    return acc;
  }, {} as Record<string, number>);
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const now = new Date();
  const currentMonthKey = getCurrentMonthKey(now);
  const { monthStart, nextMonthStart } = getMonthRangeLocal(now);
  const last7DaysStart = getLast7DaysStartLocal(now);

  const [
    { data: monthlyDailyData, error: recordsError },
    { data: budgetData, error: budgetError },
    { data: anyBudgetData, error: anyBudgetError },
  ]
    = await Promise.all([
      supabase
        .from("account_records")
        .select("amount, created_at, currency_type")
        .eq("user_id", userId)
        .eq("record_type", "daily")
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", nextMonthStart.toISOString()),
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
    ]);

  if (recordsError) {
    return Promise.reject(recordsError);
  }

  if (budgetError) {
    return Promise.reject(budgetError);
  }

  if (anyBudgetError) {
    return Promise.reject(anyBudgetError);
  }

  const monthlyRecords = (monthlyDailyData ?? []) as DailyExpenseRecord[];
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
    };
  }

  const monthTotalByCurrency = toMapByCurrency(monthlyRecords);
  const last7DaysRecords = monthlyRecords.filter(record => new Date(record.created_at) >= last7DaysStart);
  const last7DaysTotalByCurrency = toMapByCurrency(last7DaysRecords);

  const items = budgetCurrencies.map((currencyType) => {
    const monthTotal = monthTotalByCurrency[currencyType] ?? 0;
    const avgLast7Days = (last7DaysTotalByCurrency[currencyType] ?? 0) / 7;
    const budgetAmount = effectiveBudgetByCurrency[currencyType] ?? 0;
    const usagePercent = budgetAmount > 0 ? (monthTotal / budgetAmount) * 100 : 0;

    return {
      avgLast7Days,
      budgetAmount,
      currencyType,
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
