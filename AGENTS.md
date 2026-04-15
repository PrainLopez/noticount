# AGENTS.md — Noticount 代码库指南

给仓库内 AI 助手和贡献者。以 **ESLint 配置** + **现有代码** 为准；本文档讲架构和习惯，避免和 [eslint.config.mjs](eslint.config.mjs) 打架。

## 项目简介

**Noticount**：自托管、**多币种**前端记账（见 [README.md](README.md)）。技术栈：

- **Next.js**（App Router，`next dev --turbopack`）
- **React**、**TypeScript**
- **Tailwind CSS**、**shadcn/ui**（Radix 等，位于 `components/ui/`）
- **Supabase**（认证 + Postgres）
- **TanStack Query**（服务端状态 + 缓存）
- **Zod**、**@t3-oss/env-nextjs**（环境变量校验）

包管理器：**pnpm**（`package.json` 里给 `@types/react` / `@types/react-dom` 配了 `pnpm.overrides`）。

## 常用命令

| 命令            | 说明                 |
| --------------- | -------------------- |
| `pnpm dev`      | 本地开发（Turbopack） |
| `pnpm build`    | 生产构建             |
| `pnpm start`    | 启动生产服务         |
| `pnpm lint`     | ESLint 检查 + 格式规则 |
| `pnpm lint:fix` | 自动修复可修项       |
| `pnpm supabase:type` | 生成 Supabase 类型定义 |

仓库无独立 Prettier。格式化交给 **ESLint**（`@antfu/eslint-config` + `formatters: true` + `eslint-plugin-format`）。文档和风格冲突时，听 `pnpm lint`。

## 代码风格（与 ESLint 对齐）

写新代码按 [eslint.config.mjs](eslint.config.mjs)：

- **对象类型**：用 `type`，不用 `interface`（`ts/consistent-type-definitions`）。
- **尾随逗号**：**不用**（`trailingComma: "never"`）。
- **缩进**：2 空格；**字符串**：双引号；**语句**：分号。
- **文件名**：`kebab-case`（`unicorn/filename-case`）；`README.md`、`AGENTS.md` 例外。
- **`process.env`**：TS/TSX 禁止直接读（`node/no-process-env`）。唯一例外 **[`src/env.js`](src/env.js)**：集中定义 + 校验环境变量。
- 其他：`no-console` 是 **warn**；`perfectionist/sort-imports`、`sort-exports` 是 **warn**。

提交前跑 `pnpm lint` 或 `pnpm lint:fix`。

## 导入与路径

- **路径别名**：`@/*` 指向仓库根目录（见 [tsconfig.json](tsconfig.json)）。优先 `@/components/...`、`@/lib/...`、`@/src/...`，跟现有代码一致。
- **同目录类型/模块**：可用相对路径（例：`lib/supabase.ts` 里的 `./supabase.type`）。
- **不要求**导入路径写 `.ts` / `.tsx` 扩展名（按当前 Next/TS 习惯）。

## 目录约定

** 更新文件时务必同步本段 **

```
src/app/                 # App Router：页面与布局
  (index)/               # 路由组
    layout.tsx           # QueryClientProvider、AuthCheck、Navbar 等
    signin/page.tsx
    record/              # 记账
      layout.tsx         # 并行槽位：submit、usage、list
      @submit/page.tsx
      @usage/page.tsx
      @list/page.tsx
  _components/           # 如 auth-check、navbar、set-budget-trigger（非 route segment）
  _context/              # 如 auth-session
src/api/                 # 与 Supabase 的查询/变更封装（如 usage、user-budget-settings）
src/styles/              # 全局样式
components/ui/           # shadcn 风格 UI 组件（含 drawer）
lib/                     # supabase 客户端、utils、supabase.type.ts
```

## 环境变量

- 业务代码用 **`import { env } from "@/src/env"`**（或等价路径）取已校验变量；不要在 TS/TSX 到处写 `process.env`。
- 定义 + 校验在 **[`src/env.js`](src/env.js)**（`createEnv` + Zod）；服务端变量和 `NEXT_PUBLIC_*` 客户端变量都在这声明。
- **[`next.config.ts`](next.config.ts)** 里 `import "@/src/env.js"`，构建阶段就校验环境变量。

## Supabase 与数据

- 浏览器客户端：**[`lib/supabase.ts`](lib/supabase.ts)**，用 **`Database`** 类型（[`lib/supabase.type.ts`](lib/supabase.type.ts)）。
- 核心表 **`account_records`**：含 `amount`、`currency_type`、`record_type`、`note`、`user_id`、`created_at` 等（以类型定义为准）。
- 在 Supabase 控制台配 **RLS**，按用户隔离。客户端用 **anon key** 时权限受策略控制。若后续引入 **service role**，只放可信服务端，**不要**暴露浏览器。

## 认证与客户端数据

- **[`src/app/_components/auth-check.tsx`](src/app/_components/auth-check.tsx)**：检查 session，未登录跳 `/signin`；通过 **`AuthSessionCtx`** 向下传。
- **[`src/app/(index)/signin/page.tsx`](<src/app/(index)/signin/page.tsx>)**：GitHub OAuth、匿名登录等。
- **[`src/app/(index)/layout.tsx`](<src/app/(index)/layout.tsx>)**：顶层 **`QueryClientProvider`**；列表/提交等页面用 **`useQuery` / `useMutation` / `useInfiniteQuery`**（见 `src/api/` 和各 `page.tsx`）。

数据流概览：

```mermaid
flowchart LR
  pages[App_pages]
  rq[TanStack_Query]
  api[src_api]
  sb[Supabase_client]
  pages --> rq
  rq --> api
  api --> sb
```

## 路由说明

- **`/record`** 用并行路由槽位 **`@submit`**、**`@usage`**、**`@list`**（见 [`src/app/(index)/record/layout.tsx`](<src/app/(index)/record/layout.tsx>)），同屏渲染录入、统计、列表。

## Git 与提交

- **simple-git-hooks**：`pre-commit` 跑 **lint-staged**，对暂存文件执行 **`eslint`**。
- 提交前本地跑 `pnpm lint`，少踩 CI / hook 失败。

## 测试

当前仓库**未配**单元测试运行器（如 Vitest/Jest）。要补测试，建议按现有 ESLint/TS 工具链引入。

## 对 AI 与贡献者的期望

- **小范围修改**：只改任务相关文件；别做无关重构和「顺手整理」。
- **风格一致**：跟现有组件、API 层写法保持一致；不确定就看本文件 + `eslint.config.mjs` + 邻近代码。
- **性能与 UX**：用 TanStack Query 的列表注意缓存失效和加载状态；敏感信息别写日志或客户端。

---

文档会随仓库演进更新；若和 ESLint 或 `package.json` 脚本冲突，以配置和脚本为准。
