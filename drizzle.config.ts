import { defineConfig } from "drizzle-kit";
import process from "node:process";

try {
  process.loadEnvFile();
}
catch {
  // .env 可选（例如 CI 直接注入环境变量）
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // generate 不连库；migrate 时才需要真实的 DATABASE_URL
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/postgres",
  },
});
