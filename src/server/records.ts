import "server-only";
import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm";

import type { CurrencyType, RecordType } from "@/src/db/schema";

import { db } from "@/src/db/client";
import { accountRecords } from "@/src/db/schema";

import { get7DayRangeLocal } from "./dates";

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
  dateRangeEnd: string;
  dateRangeStart: string;
  hasMore: boolean;
  nextPage: number;
};

export type InsertAccountRecordInput = {
  amount: string;
  currencyType: CurrencyType;
  note: string | null;
  recordType: RecordType;
};

export async function insertAccountRecord(
  userId: string,
  input: InsertAccountRecordInput,
): Promise<{ id: number }> {
  const [row] = await db
    .insert(accountRecords)
    .values({
      amount: input.amount,
      currencyType: input.currencyType,
      note: input.note,
      recordType: input.recordType,
      userId,
    })
    .returning({ id: accountRecords.id });

  if (!row) {
    throw new Error("Insert returned no row");
  }

  return row;
}

export async function listRecordsInRange(
  userId: string,
  range: { start: Date; end: Date },
): Promise<RecentRecord[]> {
  const rows = await db
    .select({
      amount: accountRecords.amount,
      createdAt: accountRecords.createdAt,
      currencyType: accountRecords.currencyType,
      id: accountRecords.id,
      note: accountRecords.note,
      recordType: accountRecords.recordType,
    })
    .from(accountRecords)
    .where(and(
      eq(accountRecords.userId, userId),
      gte(accountRecords.createdAt, range.start),
      lte(accountRecords.createdAt, range.end),
    ))
    .orderBy(desc(accountRecords.createdAt));

  return rows.map(row => ({
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
    currencyType: row.currencyType,
    id: row.id,
    note: row.note,
    recordType: row.recordType,
  }));
}

export async function hasRecordsOlderThan(
  userId: string,
  date: Date,
): Promise<boolean> {
  const rows = await db
    .select({ exists: sql<number>`1` })
    .from(accountRecords)
    .where(and(
      eq(accountRecords.userId, userId),
      lt(accountRecords.createdAt, date),
    ))
    .limit(1);

  return rows.length > 0;
}

export async function getRecentRecordsPaginated(
  userId: string,
  page: number = 0,
): Promise<PaginatedRecords> {
  const range = get7DayRangeLocal(page);
  const [data, hasMore] = await Promise.all([
    listRecordsInRange(userId, range),
    hasRecordsOlderThan(userId, range.start),
  ]);

  return {
    data,
    dateRangeEnd: range.end.toISOString(),
    dateRangeStart: range.start.toISOString(),
    hasMore: hasMore && page < 50,
    nextPage: page + 1,
  };
}
