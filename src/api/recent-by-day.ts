import { supabase } from "@/lib/supabase";
import { requireSessionUserId } from "@/src/api/session-user";

export type RecentRecord = {
  amount: number;
  created_at: string;
  currency_type: string;
  id: number;
  note: string | null;
  record_type: string;
  user_id: string;
};

export type PaginatedRecords = {
  data: RecentRecord[];
  hasMore: boolean;
  nextPage: number;
  dateRangeStart: string;
  dateRangeEnd: string;
};

/**
 * Get date range for a 7-day period based on page number
 * Page 0: Today to 6 days ago (last 7 days)
 * Page 1: 7 days ago to 13 days ago
 * Page 2: 14 days ago to 20 days ago, etc.
 */
function get7DayRangeLocal(page: number): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  // Move end date back by (page * 7) days
  end.setDate(end.getDate() - (page * 7));

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  // Start is 6 days before end (7 days total including end day)
  start.setDate(start.getDate() - 6);

  return { start, end };
}

export async function getRecentRecordsPaginated(
  page: number = 0,
  userId?: string,
): Promise<PaginatedRecords> {
  const uid = userId ?? await requireSessionUserId();
  const { start, end } = get7DayRangeLocal(page);

  const { data, error } = await supabase
    .from("account_records")
    .select("*")
    .eq("user_id", uid)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return Promise.reject(error);
  }

  // Check if there are records in the next 7-day period
  const nextRange = get7DayRangeLocal(page + 1);
  const { data: nextData } = await supabase
    .from("account_records")
    .select("id")
    .eq("user_id", uid)
    .gte("created_at", nextRange.start.toISOString())
    .lte("created_at", nextRange.end.toISOString())
    .limit(1);

  const hasMore = (nextData?.length ?? 0) > 0;

  return {
    data: data || [],
    hasMore,
    nextPage: page + 1,
    dateRangeStart: start.toISOString(),
    dateRangeEnd: end.toISOString(),
  };
}
