import { fetchJson } from "@/src/api/fetch-json";

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

// 7 天窗口在浏览器本地时区计算后作为 ISO 区间传给服务端，由服务端按区间过滤
export async function getRecentRecordsPaginated(page: number = 0): Promise<PaginatedRecords> {
  const { start, end } = get7DayRangeLocal(page);
  const nextRange = get7DayRangeLocal(page + 1);

  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    nextStart: nextRange.start.toISOString(),
    nextEnd: nextRange.end.toISOString(),
  });

  const { data, hasMore } = await fetchJson<{ data: RecentRecord[]; hasMore: boolean }>(
    `/api/records/recent?${params.toString()}`,
  );

  return {
    data,
    hasMore,
    nextPage: page + 1,
    dateRangeStart: start.toISOString(),
    dateRangeEnd: end.toISOString(),
  };
}
