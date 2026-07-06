"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RecentRecord } from "@/src/api/recent-by-day";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getRecentRecordsPaginated } from "@/src/api/recent-by-day";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";

type GroupedRecords = Record<string, RecentRecord[]>;

type CurrencyTotals = Record<string, Record<string, number>>;

type DaySummary = {
  count: number;
  totals: CurrencyTotals;
};

const currencySymbols: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  CNY: "¥",
  JPY: "¥",
};

const currencyOrder = ["CNY", "GBP", "USD", "EUR", "JPY"];
const recordTypeOrder = ["daily", "special"];

function sortByDefinedOrder(a: string, b: string, order: string[]): number {
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);

  if (indexA === -1 && indexB === -1)
    return a.localeCompare(b);
  if (indexA === -1)
    return 1;
  if (indexB === -1)
    return -1;

  return indexA - indexB;
}

function getRecordTypeColor(recordType: string): string {
  return recordType === "daily"
    ? "bg-blue-100 text-blue-800"
    : "bg-purple-100 text-purple-800";
}

function groupRecordsByLocalDay(records: RecentRecord[]): GroupedRecords {
  return records.reduce((groups, record) => {
    const date = new Date(record.created_at);
    const localDay = date.toLocaleDateString("en-CA");

    if (!groups[localDay]) {
      groups[localDay] = [];
    }
    groups[localDay].push(record);

    return groups;
  }, {} as GroupedRecords);
}

function calculateDaySummary(records: RecentRecord[]): DaySummary {
  const totals = records.reduce((acc, record) => {
    if (!acc[record.currency_type]) {
      acc[record.currency_type] = {};
    }
    if (!acc[record.currency_type][record.record_type]) {
      acc[record.currency_type][record.record_type] = 0;
    }
    acc[record.currency_type][record.record_type] += Number(record.amount);
    return acc;
  }, {} as CurrencyTotals);

  return {
    count: records.length,
    totals,
  };
}

function DayHeader({ date, summary }: { date: string; summary: DaySummary }) {
  const formatDayHeader = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-base">{formatDayHeader(date)}</h3>
      <div className="flex flex-row gap-2 items-center flex-wrap">
        <span className="text-xs text-muted-foreground">
          {summary.count}
          {" "}
          {summary.count === 1 ? "record" : "records"}
        </span>
        {Object.entries(summary.totals)
          .sort(([a], [b]) => sortByDefinedOrder(a, b, currencyOrder))
          .map(([currency, types]) =>
            Object.entries(types)
              .sort(([a], [b]) => sortByDefinedOrder(a, b, recordTypeOrder))
              .map(([recordType, total]) => {
                return (
                  <Badge key={`${currency}-${recordType}`} className={getRecordTypeColor(recordType)}>
                    {currencySymbols[currency] || currency}
                    {total.toFixed(2)}
                  </Badge>
                );
              }),
          )}
      </div>
    </div>
  );
}

export default function RecordListPage() {
  const authSession = use(AuthSessionCtx);
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["account-records", authSession?.userId],
    queryFn: ({ pageParam = 0 }) => {
      if (!authSession?.userId) {
        return Promise.reject(new Error("User not authenticated"));
      }
      return getRecentRecordsPaginated(authSession.userId, pageParam);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    enabled: !!authSession?.userId,
    initialPageParam: 0,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);

    if (element)
      observer.observe(element);

    return () => {
      if (element)
        observer.unobserve(element);
    };
  }, [handleObserver]);

  const allRecords = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data?.pages],
  );

  const groupedRecords = useMemo(
    () => groupRecordsByLocalDay(allRecords),
    [allRecords],
  );

  const sortedDays = useMemo(
    () => Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a)),
    [groupedRecords],
  );

  const [closedItems, setClosedItems] = useState<string[]>([]);

  const openItems = useMemo(
    () => sortedDays.filter(day => !closedItems.includes(day)),
    [closedItems, sortedDays],
  );

  const handleOpenItemsChange = useCallback((nextOpenItems: string[]) => {
    setClosedItems(sortedDays.filter(day => !nextOpenItems.includes(day)));
  }, [sortedDays]);

  if (isLoading) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["day-a", "day-b", "day-c"].map(key => (
            <div key={key} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Error loading records. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (allRecords.length === 0) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg w-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Records</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={openItems} onValueChange={handleOpenItemsChange}>
          {sortedDays.map((day) => {
            const dayRecords = groupedRecords[day];
            const daySummary = calculateDaySummary(dayRecords);

            return (
              <AccordionItem key={day} value={day}>
                <AccordionTrigger>
                  <DayHeader date={day} summary={daySummary} />
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <Table>
                    <TableBody>
                      {dayRecords.map((record) => {
                        return (
                          <TableRow key={record.id} className="grid grid-cols-[2fr_1fr_3fr] ov">
                            <TableCell className="font-semibold gap-1 flex items-center">
                              <span>{currencySymbols[record.currency_type] || record.currency_type}</span>
                              <span>{Number(record.amount).toFixed(2)}</span>
                            </TableCell>
                            <TableCell className="">
                              <span className={`text-xs px-2 py-1 rounded-full ${getRecordTypeColor(record.record_type)}`}>
                                {record.record_type}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-ellipsis overflow-hidden">
                              {record.note || "——"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        <div ref={observerTarget} className="h-4" />
        {isFetchingNextPage && (
          <p className="text-muted-foreground text-sm text-center py-4">Loading more...</p>
        )}
      </CardContent>
    </Card>
  );
}
