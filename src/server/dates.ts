export function get7DayRangeLocal(page: number, now: Date = new Date()): { end: Date; start: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - (page * 7));

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return { end, start };
}

export function getCurrentMonthKey(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return year * 100 + month;
}

export function getMonthRangeLocal(date: Date = new Date()): { monthStart: Date; nextMonthStart: Date } {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);

  return { monthStart, nextMonthStart };
}
