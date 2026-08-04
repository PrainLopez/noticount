import { supabase } from "@/lib/supabase";

export type MonthlySettlement = {
  budget_amount: number;
  currency_type: string;
  month_key: number;
  spend_amount: number;
  user_id: string;
};

export async function getMonthlySettlements(userId: string): Promise<MonthlySettlement[]> {
  const { data, error } = await supabase
    .from("monthly_budget_settlements")
    .select("budget_amount, currency_type, month_key, spend_amount, user_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function upsertMonthlySettlements(rows: MonthlySettlement[]): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("monthly_budget_settlements")
    .upsert(rows, { ignoreDuplicates: true, onConflict: "user_id,currency_type,month_key" });

  if (error) {
    throw error;
  }
}
