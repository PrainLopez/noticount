import { supabase } from "@/lib/supabase";

type BudgetSettingInsertData = {
  budget_amount: number;
  currency_type: string;
  time_to_effect: number;
  user_id: string;
};

export async function insertBudgetSetting(input: BudgetSettingInsertData) {
  const { error } = await supabase
    .from("user_budget_settings")
    .insert(input);

  if (error) {
    throw error;
  }
}
