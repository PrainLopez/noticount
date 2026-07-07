import type { CurrencyType, RecordType } from "@/src/db/schema";

export type RecentRecord = {
  amount: string;
  createdAt: string;
  currencyType: CurrencyType;
  id: number;
  note: string | null;
  recordType: RecordType;
};

export type PaginatedRecords = {
  data: RecentRecord[];
  hasMore: boolean;
  nextPage: number;
  dateRangeStart: string;
  dateRangeEnd: string;
};

export async function getRecentRecordsPaginated(
  _userId: string,
  page: number = 0,
): Promise<PaginatedRecords> {
  const response = await fetch(`/api/account-records/list?page=${page}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`List account records failed: ${response.status}`);
  }

  return (await response.json()) as PaginatedRecords;
}
