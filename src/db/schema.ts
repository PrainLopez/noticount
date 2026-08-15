import { boolean, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// better-auth 核心表（user/session/account/verification），与业务表同库
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// 业务表：user_id 引用 better-auth 的 user.id（text）
export const accountRecords = pgTable("account_records", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  currency_type: text("currency_type").notNull(),
  record_type: text("record_type").notNull(),
  note: text("note"),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const userBudgetSettings = pgTable("user_budget_settings", {
  id: serial("id").primaryKey(),
  budget_amount: numeric("budget_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  currency_type: text("currency_type").notNull(),
  time_to_effect: integer("time_to_effect").notNull(),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const monthlyBudgetSettlements = pgTable("monthly_budget_settlements", {
  id: serial("id").primaryKey(),
  budget_amount: numeric("budget_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  spend_amount: numeric("spend_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  currency_type: text("currency_type").notNull(),
  month_key: integer("month_key").notNull(),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, table => [
  uniqueIndex("monthly_budget_settlements_user_currency_month_key")
    .on(table.user_id, table.currency_type, table.month_key),
]);
