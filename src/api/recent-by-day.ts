import { supabase } from "@/lib/supabase";

type RecentRecord = {
  amount: number;
  created_at: string;
  currency_type: string;
  id: number;
  note: string | null;
  record_type: string;
  user_id: string;
};

function getLast7DaysStartLocal(): Date {
  const d = new Date();
  // 回到今天本地 00:00:00
  d.setHours(0, 0, 0, 0);
  // 再往前推 6 天，覆盖共 7 天（含今天）
  d.setDate(d.getDate() - 6);
  return d;
}

export async function getRecentRecordsByDay(userId: string): Promise<RecentRecord[] | null> {
  const { data, error } = await supabase
    .from("account_records")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", new Date(getLast7DaysStartLocal().getTime()).toISOString())
    .order("created_at", { ascending: false });
  if (error) {
    // toast.error(`Query error:\n ${error}`);
    return Promise.reject(error);
  }
  else {
    return data;
  }
}
