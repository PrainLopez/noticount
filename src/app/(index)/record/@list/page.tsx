"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RecentRecord } from "@/src/api/recent-by-day";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getRecentRecordsPaginated } from "@/src/api/recent-by-day";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";

type GroupedRecords = Record<string, RecentRecord[]>;

type DaySummary = {
  count: number;
  totalsByCurrency: Record<string, number>;
};

function groupRecordsByLocalDay(records: RecentRecord[]): GroupedRecords {
  return records.reduce((groups, record) => {
    const date = new Date(record.created_at);
    const localDay = date.toLocaleDateString("en-CA"); // YYYY-MM-DD format

    if (!groups[localDay]) {
      groups[localDay] = [];
    }
    groups[localDay].push(record);

    return groups;
  }, {} as GroupedRecords);
}

function calculateDaySummary(records: RecentRecord[]): DaySummary {
  const totalsByCurrency = records.reduce((totals, record) => {
    if (!totals[record.currency_type]) {
      totals[record.currency_type] = 0;
    }
    totals[record.currency_type] += record.amount;
    return totals;
  }, {} as Record<string, number>);

  return {
    count: records.length,
    totalsByCurrency,
  };
}

function DayHeader({ date, summary }: { date: string; summary: DaySummary }) {
  const currencySymbols: Record<string, string> = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    CNY: "¥",
    JPY: "¥",
  };

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
          {summary.count} {summary.count === 1 ? "record" : "records"}
        </span>
        {Object.entries(summary.totalsByCurrency).map(([currency, total]) => (
          <Badge key={currency} variant="default">
            {currencySymbols[currency] || currency}{total.toFixed(2)}
          </Badge>
        ))}
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
    queryKey: ["account-records", authSession?.user?.id],
    queryFn: ({ pageParam = 0 }) => {
      if (!authSession?.user?.id) {
        return Promise.reject(new Error("User not authenticated"));
      }
      return getRecentRecordsPaginated(authSession.user.id, pageParam);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    enabled: !!authSession?.user?.id,
    initialPageParam: 0,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
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

  const allRecords = data?.pages.flatMap(page => page.data) || [];

  const groupedRecords = useMemo(
    () => groupRecordsByLocalDay(allRecords),
    [allRecords],
  );

  const sortedDays = useMemo(
    () => Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a)),
    [groupedRecords],
  );

  // Calculate date range for display
  // const dateRangeDisplay = useMemo(() => {
  //   if (!data?.pages.length)
  //     return "Recent Records";

  //   const firstPage = data.pages[0];
  //   const lastPage = data.pages[data.pages.length - 1];

  //   if (!firstPage || !lastPage)
  //     return "Recent Records";

  //   const startDate = new Date(lastPage.dateRangeStart);
  //   const endDate = new Date(firstPage.dateRangeEnd);

  //   const formatDate = (date: Date) => {
  //     return new Intl.DateTimeFormat("en-US", {
  //       month: "short",
  //       day: "numeric",
  //       year: "numeric",
  //     }).format(date);
  //   };

  //   return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  // }, [data]);

  // Set all accordion items to be open by default
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    setOpenItems((prev) => {
      const newDays = sortedDays.filter(day => !prev.includes(day));
      return [...prev, ...newDays];
    });
  }, [sortedDays.join(",")]);

  if (isLoading) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading records...</p>
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
        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
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
                    {/* <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader> */}
                    <TableBody>
                      {dayRecords.map((record) => {
                        const currencySymbols: Record<string, string> = {
                          GBP: "£",
                          USD: "$",
                          EUR: "€",
                          CNY: "¥",
                          JPY: "¥",
                        };

                        const typeColor = record.record_type === "daily"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800";

                        return (
                          <TableRow key={record.id} className="grid grid-cols-[2fr_1fr_3fr] ov">
                            <TableCell className="font-semibold gap-1 flex items-center">
                              <span>{currencySymbols[record.currency_type] || record.currency_type}</span>
                              <span>{record.amount.toFixed(2)}</span>
                            </TableCell>
                            <TableCell className="">
                              <span className={`text-xs px-2 py-1 rounded-full ${typeColor}`}>
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
