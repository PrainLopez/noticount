import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL ?? "",
  },
  verbose: true,
  strict: true,
});
