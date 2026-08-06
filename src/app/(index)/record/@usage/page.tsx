"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsageSummary } from "@/src/api/usage";
import ProgressBar from "@/src/app/_components/progress-bar";
import SetBudgetTrigger from "@/src/app/_components/set-budget-trigger";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";

const currencySymbols: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  CNY: "¥",
  JPY: "¥",
};

export default function UsagePage() {
  const authSession = use(AuthSessionCtx);

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["usage", authSession?.user?.id],
    queryFn: () => getUsageSummary(),
    enabled: !!authSession?.user?.id,
  });

  if (isLoading) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader>
          <CardTitle className="text-lg">Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="space-y-1.5">
            <Skeleton className="h-5 w-44" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-16" />
            </div>
          </section>

          <section className="space-y-2">
            <Skeleton className="h-5 w-52" />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-4 w-32 ml-auto" />
            </div>
          </section>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader>
          <CardTitle className="text-lg">Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Error loading usage. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.hasBudget) {
    return (
      <Card className="rounded-lg w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg">Usage</CardTitle>
          <SetBudgetTrigger currentMonthKey={data.currentMonthKey} isFirstSetup={data.isFirstSetup} />
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">No monthly budget is in effect.</p>
          <p className="text-muted-foreground text-sm">
            Set your first monthly budget to start tracking usage for this month.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Usage</CardTitle>
        <SetBudgetTrigger currentMonthKey={data.currentMonthKey} isFirstSetup={data.isFirstSetup} />
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <p className="text-sm font-semibold">7-Day Average Cost (Daily)</p>
          {data.items.map(item => (
            <div key={`avg-${item.currencyType}`} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.currencyType}</span>
              <span className="font-semibold">
                {currencySymbols[item.currencyType] || item.currencyType}
                {item.avgLast7Days.toFixed(2)}
              </span>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <p className="text-sm font-semibold">Monthly Budget Usage (Daily)</p>
          {data.items.map((item) => {
            const percentText = `${item.usagePercent.toFixed(1)}%`;

            return (
              <div key={`budget-${item.currencyType}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.currencyType}</span>
                  <span className="font-semibold">{percentText}</span>
                </div>
                <ProgressBar markerPercent={data.monthElapsedPercent} percent={item.usagePercent} />
                <p className="text-xs text-muted-foreground text-right">
                  {currencySymbols[item.currencyType] || item.currencyType}
                  {item.monthTotal.toFixed(2)} / {currencySymbols[item.currencyType] || item.currencyType}
                  {item.totalAvailable.toFixed(2)}
                </p>
              </div>
            );
          })}
        </section>
      </CardContent>
    </Card>
  );
}
