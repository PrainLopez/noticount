import { supabase } from "@/lib/supabase";
import { requireSessionUserId } from "@/src/api/session-user";

export type MonthlySettlement = {
  budget_amount: number;
  currency_type: string;
  month_key: number;
  spend_amount: number;
};

// userId 仅限 src/api 内部传递（由调用方经 requireSessionUserId 取得），页面/组件不得传入
export async function getMonthlySettlements(userId?: string): Promise<MonthlySettlement[]> {
  const uid = userId ?? await requireSessionUserId();

  const { data, error } = await supabase
    .from("monthly_budget_settlements")
    .select("budget_amount, currency_type, month_key, spend_amount")
    .eq("user_id", uid);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function upsertMonthlySettlements(rows: MonthlySettlement[], userId?: string): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const uid = userId ?? await requireSessionUserId();
  const stampedRows = rows.map(row => ({ ...row, user_id: uid }));

  const { error } = await supabase
    .from("monthly_budget_settlements")
    .upsert(stampedRows, { ignoreDuplicates: true, onConflict: "user_id,currency_type,month_key" });

  if (error) {
    throw error;
  }
}
