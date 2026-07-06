DO $$ BEGIN
  CREATE TYPE "currency_type" AS ENUM('CNY', 'GBP', 'USD', 'EUR', 'JPY');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "record_type" AS ENUM('daily', 'special');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "amount" numeric(18, 2) NOT NULL,
  "currency_type" "currency_type" NOT NULL,
  "record_type" "record_type" NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_budget_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "budget_amount" numeric(18, 2) NOT NULL,
  "currency_type" "currency_type" NOT NULL,
  "time_to_effect" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "account_records" ALTER COLUMN "currency_type" TYPE "currency_type" USING "currency_type"::"currency_type";
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "account_records" ALTER COLUMN "record_type" TYPE "record_type" USING "record_type"::"record_type";
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_budget_settings" ALTER COLUMN "currency_type" TYPE "currency_type" USING "currency_type"::"currency_type";
EXCEPTION WHEN duplicate_object THEN null; END $$;
