import "server-only";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/src/env";

import * as schema from "./schema";

let cachedClient: Sql | undefined;
let cachedDb: PostgresJsDatabase<typeof schema> | undefined;

function ensureDb(): PostgresJsDatabase<typeof schema> {
  if (cachedDb) {
    return cachedDb;
  }
  const connectionString = env.POSTGRES_URL ?? env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      "No Postgres connection string configured. Set POSTGRES_URL or POSTGRES_PRISMA_URL.",
    );
  }
  cachedClient = postgres(connectionString, {
    prepare: false,
    max: 10,
  });
  cachedDb = drizzle(cachedClient, { schema });
  return cachedDb;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = ensureDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type DB = PostgresJsDatabase<typeof schema>;
