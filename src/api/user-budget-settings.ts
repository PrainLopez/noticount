import { fetchJson, postJson } from "@/src/api/fetch-json";

type BudgetSettingInsertData = {
  budget_amount: number;
  currency_type: string;
  time_to_effect: number;
};

export async function insertBudgetSetting(input: BudgetSettingInsertData): Promise<void> {
  await fetchJson("/api/budget-settings", postJson(input));
}
