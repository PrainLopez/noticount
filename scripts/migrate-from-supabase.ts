/**
 * 一次性迁移脚本：Supabase → 自托管 Postgres（better-auth + 业务表）
 *
 * 用法：
 *   1. .env 里配置 SUPABASE_DB_URL（Supabase 直连 Postgres 字符串）和 DATABASE_URL（目标库）
 *   2. 先在目标库执行 drizzle migration（pnpm db:migrate）
 *   3. pnpm migrate:supabase
 *
 * 说明：
 * - user.id 直接沿用 Supabase auth.users 的 uuid，业务表 user_id 无需重映射
 * - GitHub 身份写入 account 表（providerId=github，accountId=provider_id），
 *   用户下次用 GitHub 登录会命中同一条 user 记录
 * - 匿名用户没有可重连的凭据，数据保留在原 user id 下占位
 * - 全量 ON CONFLICT DO NOTHING，可重复执行（幂等）
 */
import process from "node:process";
import postgres from "postgres";

try {
  process.loadEnvFile();
}
catch {
  // .env 可选（例如 CI 直接注入环境变量）
}

const sourceUrl = process.env.SUPABASE_DB_URL;
const targetUrl = process.env.DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  throw new Error("SUPABASE_DB_URL and DATABASE_URL are required");
}

const source = postgres(sourceUrl);
const target = postgres(targetUrl);

type SourceUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  is_anonymous: boolean;
  raw_user_meta_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type SourceIdentity = {
  user_id: string;
  provider: string;
  provider_id: string;
};

async function main() {
  const [users, identities, records, budgets, settlements] = await Promise.all([
    source<SourceUser[]>`
      select id, email, email_confirmed_at, is_anonymous, raw_user_meta_data, created_at, updated_at
      from auth.users
    `,
    source<SourceIdentity[]>`
      select user_id, provider, provider_id from auth.identities
    `,
    source`
      select id, amount, currency_type, record_type, note, user_id, created_at
      from public.account_records
    `,
    source`
      select id, budget_amount, currency_type, time_to_effect, user_id, created_at
      from public.user_budget_settings
    `,
    source`
      select id, budget_amount, spend_amount, currency_type, month_key, user_id, created_at
      from public.monthly_budget_settlements
    `,
  ]);

  console.log(`source: ${users.length} users, ${records.length} records, ${budgets.length} budgets, ${settlements.length} settlements`);

  const now = new Date();

  await target.begin(async (sql) => {
    if (users.length > 0) {
      const userRows = users.map((user) => {
        const meta = user.raw_user_meta_data ?? {};
        const name = typeof meta.user_name === "string"
          ? meta.user_name
          : typeof meta.name === "string"
            ? meta.name
            : user.email ?? "Anonymous user";
        return {
          id: user.id,
          name,
          email: user.email ?? `${user.id}@anonymous.local`,
          email_verified: user.email_confirmed_at !== null,
          image: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
          is_anonymous: user.is_anonymous,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
      });

      await sql`
        insert into "user" ${sql(userRows, "id", "name", "email", "email_verified", "image", "is_anonymous", "created_at", "updated_at")}
        on conflict (id) do nothing
      `;
    }

    const accountRows = identities.map(identity => ({
      id: crypto.randomUUID(),
      account_id: identity.provider_id,
      provider_id: identity.provider,
      user_id: identity.user_id,
      created_at: now,
      updated_at: now,
    }));

    if (accountRows.length > 0) {
      await sql`
        insert into "account" ${sql(accountRows, "id", "account_id", "provider_id", "user_id", "created_at", "updated_at")}
        on conflict (id) do nothing
      `;
    }

    if (records.length > 0) {
      await sql`
        insert into "account_records" ${sql(records, "id", "amount", "currency_type", "record_type", "note", "user_id", "created_at")}
        on conflict (id) do nothing
      `;
    }

    if (budgets.length > 0) {
      await sql`
        insert into "user_budget_settings" ${sql(budgets, "id", "budget_amount", "currency_type", "time_to_effect", "user_id", "created_at")}
        on conflict (id) do nothing
      `;
    }

    if (settlements.length > 0) {
      await sql`
        insert into "monthly_budget_settlements" ${sql(settlements, "id", "budget_amount", "spend_amount", "currency_type", "month_key", "user_id", "created_at")}
        on conflict (id) do nothing
      `;
    }

    // 同步 serial 序列，避免后续插入主键冲突
    for (const table of ["account_records", "user_budget_settings", "monthly_budget_settlements"]) {
      await sql`
        select setval(pg_get_serial_sequence(${table}, 'id'), coalesce((select max(id) from ${sql(table)}), 1))
      `;
    }
  });

  console.log("migration done");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => Promise.all([source.end(), target.end()]));
