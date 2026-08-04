import { describe, expect, it } from "vitest";

import {
  addMonthsKey,
  buildBudgetTimeline,
  buildSettlementRows,
  buildUsageItem,
  planPendingSettlements,
  sumSettledDeltaByCurrency,
} from "./usage";

const USER_ID = "user-1";

function budgetRow(id: number, amount: number, monthKey: number, currencyType = "CNY") {
  return {
    budget_amount: amount,
    currency_type: currencyType,
    id,
    time_to_effect: monthKey,
  };
}

describe("addMonthsKey", () => {
  it("moves within the same year", () => {
    expect(addMonthsKey(202608, -1)).toBe(202607);
    expect(addMonthsKey(202608, 2)).toBe(202610);
  });

  it("crosses the year boundary forward", () => {
    expect(addMonthsKey(202512, 1)).toBe(202601);
  });

  it("crosses the year boundary backward", () => {
    expect(addMonthsKey(202601, -2)).toBe(202511);
  });
});

describe("buildBudgetTimeline", () => {
  it("sorts changes ascending and keeps same-month rows in id order", () => {
    const timeline = buildBudgetTimeline([
      budgetRow(2, 1200, 202603),
      budgetRow(1, 1000, 202601),
      budgetRow(3, 1500, 202603),
    ]);

    expect(timeline.CNY).toEqual([
      { amount: 1000, monthKey: 202601 },
      { amount: 1200, monthKey: 202603 },
      { amount: 1500, monthKey: 202603 },
    ]);
  });

  it("groups currencies independently", () => {
    const timeline = buildBudgetTimeline([
      budgetRow(1, 1000, 202601, "CNY"),
      budgetRow(2, 500, 202602, "USD"),
    ]);

    expect(Object.keys(timeline).sort()).toEqual(["CNY", "USD"]);
    expect(timeline.USD).toEqual([{ amount: 500, monthKey: 202602 }]);
  });
});

describe("planPendingSettlements", () => {
  // 当前 2026-08，宽限期 1 个月 → 归档最迟到 2026-06
  const currentMonthKey = 202608;

  it("settles nothing when the budget starts this month", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202608)]);

    expect(planPendingSettlements({ budgetTimeline: timeline, currentMonthKey, settledMonthKeys: {} })).toEqual({});
  });

  it("settles nothing when the budget took effect last month (grace period)", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202607)]);

    expect(planPendingSettlements({ budgetTimeline: timeline, currentMonthKey, settledMonthKeys: {} })).toEqual({});
  });

  it("settles the month before last", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202606)]);

    expect(planPendingSettlements({ budgetTimeline: timeline, currentMonthKey, settledMonthKeys: {} })).toEqual({
      CNY: [202606],
    });
  });

  it("settles every month since the budget first took effect", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202604)]);

    expect(planPendingSettlements({ budgetTimeline: timeline, currentMonthKey, settledMonthKeys: {} })).toEqual({
      CNY: [202604, 202605, 202606],
    });
  });

  it("skips already settled months (idempotent)", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202604)]);

    expect(planPendingSettlements({
      budgetTimeline: timeline,
      currentMonthKey,
      settledMonthKeys: { CNY: [202604, 202605] },
    })).toEqual({
      CNY: [202606],
    });
  });

  it("plans currencies independently", () => {
    const timeline = buildBudgetTimeline([
      budgetRow(1, 1000, 202605, "CNY"),
      budgetRow(2, 500, 202607, "USD"),
    ]);

    expect(planPendingSettlements({ budgetTimeline: timeline, currentMonthKey, settledMonthKeys: {} })).toEqual({
      CNY: [202605, 202606],
    });
  });
});

describe("buildSettlementRows", () => {
  it("uses each month's effective budget, including historical changes", () => {
    const timeline = buildBudgetTimeline([
      budgetRow(1, 1000, 202604),
      budgetRow(2, 1500, 202606),
    ]);

    const rows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: { CNY: [202604, 202605, 202606] },
      spendByCurrencyMonth: { CNY: { 202604: 800, 202606: 2000 } },
      userId: USER_ID,
    });

    expect(rows).toEqual([
      { budget_amount: 1000, currency_type: "CNY", month_key: 202604, spend_amount: 800, user_id: USER_ID },
      // 零开销月：全额结转
      { budget_amount: 1000, currency_type: "CNY", month_key: 202605, spend_amount: 0, user_id: USER_ID },
      { budget_amount: 1500, currency_type: "CNY", month_key: 202606, spend_amount: 2000, user_id: USER_ID },
    ]);
  });

  it("uses the largest-id row when a month has multiple budget changes", () => {
    const timeline = buildBudgetTimeline([
      budgetRow(1, 1000, 202606),
      budgetRow(2, 1800, 202606),
    ]);

    const rows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: { CNY: [202606] },
      spendByCurrencyMonth: {},
      userId: USER_ID,
    });

    expect(rows).toEqual([
      { budget_amount: 1800, currency_type: "CNY", month_key: 202606, spend_amount: 0, user_id: USER_ID },
    ]);
  });

  it("ignores future budget rows when settling past months", () => {
    const timeline = buildBudgetTimeline([
      budgetRow(1, 1000, 202601),
      budgetRow(2, 500, 202609),
    ]);

    const rows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: { CNY: [202606] },
      spendByCurrencyMonth: {},
      userId: USER_ID,
    });

    expect(rows).toEqual([
      { budget_amount: 1000, currency_type: "CNY", month_key: 202606, spend_amount: 0, user_id: USER_ID },
    ]);
  });

  it("skips months without an effective budget", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202607)]);

    const rows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: { CNY: [202606] },
      spendByCurrencyMonth: {},
      userId: USER_ID,
    });

    expect(rows).toEqual([]);
  });
});

describe("sumSettledDeltaByCurrency", () => {
  it("accumulates surplus and overspend per currency", () => {
    const delta = sumSettledDeltaByCurrency([
      { budget_amount: 1000, currency_type: "CNY", month_key: 202604, spend_amount: 800, user_id: USER_ID },
      { budget_amount: 1000, currency_type: "CNY", month_key: 202605, spend_amount: 0, user_id: USER_ID },
      { budget_amount: 1500, currency_type: "CNY", month_key: 202606, spend_amount: 2000, user_id: USER_ID },
      { budget_amount: 500, currency_type: "USD", month_key: 202606, spend_amount: 600, user_id: USER_ID },
    ]);

    expect(delta).toEqual({ CNY: 700, USD: -100 });
  });
});

describe("buildUsageItem", () => {
  it("equals the plain budget when there is no carryover", () => {
    const item = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1000,
      carryover: 0,
      currencyType: "CNY",
      monthTotal: 300,
    });

    expect(item.totalAvailable).toBe(1000);
    expect(item.usagePercent).toBeCloseTo(30);
  });

  it("adds positive carryover to the available total", () => {
    const item = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1000,
      carryover: 700,
      currencyType: "CNY",
      monthTotal: 510,
    });

    expect(item.totalAvailable).toBe(1700);
    expect(item.usagePercent).toBeCloseTo(30);
  });

  it("subtracts overspend carryover from the available total", () => {
    const item = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1000,
      carryover: -200,
      currencyType: "CNY",
      monthTotal: 400,
    });

    expect(item.totalAvailable).toBe(800);
    expect(item.usagePercent).toBeCloseTo(50);
  });

  it("reports 100% when the total available is not positive", () => {
    const negative = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1000,
      carryover: -1500,
      currencyType: "CNY",
      monthTotal: 400,
    });
    const zero = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1000,
      carryover: -1000,
      currencyType: "CNY",
      monthTotal: 400,
    });

    expect(negative.totalAvailable).toBe(-500);
    expect(negative.usagePercent).toBe(100);
    expect(zero.usagePercent).toBe(100);
  });
});

describe("carryover scenarios", () => {
  it("derives carryover purely from last month's records when the budget took effect last month", () => {
    const timeline = buildBudgetTimeline([budgetRow(1, 1000, 202607)]);
    const spendByCurrencyMonth = { CNY: { 202607: 1200 } };

    // 宽限期内无归档
    expect(planPendingSettlements({
      budgetTimeline: timeline,
      currentMonthKey: 202608,
      settledMonthKeys: {},
    })).toEqual({});

    const prevMonthRows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: { CNY: [202607] },
      spendByCurrencyMonth,
      userId: USER_ID,
    });
    const carryover = sumSettledDeltaByCurrency(prevMonthRows);

    expect(carryover.CNY).toBe(-200);

    const item = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1000,
      carryover: carryover.CNY,
      currencyType: "CNY",
      monthTotal: 0,
    });

    expect(item.totalAvailable).toBe(800);
  });

  it("combines archived surplus, new settlements and last month's records", () => {
    const currentMonthKey = 202608;
    const timeline = buildBudgetTimeline([
      budgetRow(1, 1000, 202604),
      budgetRow(2, 1500, 202606),
    ]);
    const settledFromDb = [
      { budget_amount: 1000, currency_type: "CNY", month_key: 202604, spend_amount: 1100, user_id: USER_ID },
    ];
    const spendByCurrencyMonth = { CNY: { 202605: 500, 202606: 1500, 202607: 1200 } };

    const pending = planPendingSettlements({
      budgetTimeline: timeline,
      currentMonthKey,
      settledMonthKeys: { CNY: [202604] },
    });
    expect(pending).toEqual({ CNY: [202605, 202606] });

    const newRows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: pending,
      spendByCurrencyMonth,
      userId: USER_ID,
    });
    const prevMonthRows = buildSettlementRows({
      budgetTimeline: timeline,
      pendingByCurrency: { CNY: [202607] },
      spendByCurrencyMonth,
      userId: USER_ID,
    });

    // 202604: -100, 202605: +500, 202606: 0, 202607: +300
    const carryover = sumSettledDeltaByCurrency([...settledFromDb, ...newRows, ...prevMonthRows]);
    expect(carryover.CNY).toBe(700);

    const item = buildUsageItem({
      avgLast7Days: 0,
      budgetAmount: 1500,
      carryover: carryover.CNY,
      currencyType: "CNY",
      monthTotal: 220,
    });

    expect(item.totalAvailable).toBe(2200);
    expect(item.usagePercent).toBeCloseTo(10);
  });
});
