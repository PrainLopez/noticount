import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: (() => {
      const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;
      if (!url) {
        throw new Error("POSTGRES_URL or POSTGRES_PRISMA_URL must be set");
      }
      return url;
    })(),
  },
  verbose: true,
  strict: true,
});
