import { supabase } from "@/lib/supabase";
import { requireSessionUserId } from "@/src/api/session-user";

type BudgetSettingInsertData = {
  budget_amount: number;
  currency_type: string;
  time_to_effect: number;
};

export async function insertBudgetSetting(input: BudgetSettingInsertData) {
  const userId = await requireSessionUserId();

  const { error } = await supabase
    .from("user_budget_settings")
    .insert({ ...input, user_id: userId });

  if (error) {
    throw error;
  }
}
