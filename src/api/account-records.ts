import { supabase } from "@/lib/supabase";
import { requireSessionUserId } from "@/src/api/session-user";

type AccountRecordInsertData = {
  amount: number;
  currency_type: string;
  note: string;
  record_type: string;
};

export async function insertAccountRecord(input: AccountRecordInsertData) {
  const userId = await requireSessionUserId();

  const { error } = await supabase
    .from("account_records")
    .insert({ ...input, user_id: userId });

  if (error) {
    throw error;
  }
}
