import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";

import { db } from "@/src/db";
import * as schema from "@/src/db/schema";
import { env } from "@/src/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    database: {
      // 新用户 id 统一用 uuid 格式，与 Supabase 迁移过来的老用户 id 保持一致
      generateId: () => crypto.randomUUID(),
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [anonymous()],
});
