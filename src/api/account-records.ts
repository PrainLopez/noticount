import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

type AccountRecordInsertData = {
  amount: number;
  currency_type: string;
  note: string;
  record_type: string;
  user_id: string;
};

export async function insertAccountRecord(input: AccountRecordInsertData) {
  const { error } = await supabase
    .from("account_records")
    .insert(input);

  if (error) {
    toast.error(`记录提交错误:\n${error}`);
  }
  else {
    toast.success("记录提交成功");
  }
}
