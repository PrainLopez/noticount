// 结算行的读写只在服务端进行（见 src/server/usage.ts），这里仅保留共享类型
export type MonthlySettlement = {
  budget_amount: number;
  currency_type: string;
  month_key: number;
  spend_amount: number;
};
