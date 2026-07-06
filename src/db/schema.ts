import { integer, numeric, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const currencyTypeValues = ["CNY", "GBP", "USD", "EUR", "JPY"] as const;
export const recordTypeValues = ["daily", "special"] as const;

export const currencyType = pgEnum("currency_type", currencyTypeValues);
export const recordType = pgEnum("record_type", recordTypeValues);

export type CurrencyType = (typeof currencyTypeValues)[number];
export type RecordType = (typeof recordTypeValues)[number];

export const accountRecords = pgTable("account_records", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currencyType: currencyType("currency_type").notNull(),
  recordType: recordType("record_type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userBudgetSettings = pgTable("user_budget_settings", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  budgetAmount: numeric("budget_amount", { precision: 18, scale: 2 }).notNull(),
  currencyType: currencyType("currency_type").notNull(),
  timeToEffect: integer("time_to_effect").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AccountRecord = typeof accountRecords.$inferSelect;
export type NewAccountRecord = typeof accountRecords.$inferInsert;
export type BudgetSetting = typeof userBudgetSettings.$inferSelect;
export type NewBudgetSetting = typeof userBudgetSettings.$inferInsert;
