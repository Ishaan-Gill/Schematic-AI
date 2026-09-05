# Schematic AI — multi-table-analyst

AI data analyst: upload messy CSV/XLSX datasets (multi-file, multi-sheet), ask questions in plain English, and get verified, SQL-backed answers — not hallucinated numbers. Every answer shows the SQL used, tables joined, warnings, and assumptions.

## How it works (pipeline)

```
upload (CSV/XLSX, multi-sheet)
  → parse + validate (50MB max, empty-workbook rejection)
  → normalize (table names, null values, column-type inference)
  → ingest into DuckDB-WASM (in-browser) + profile + semantic inference
  → persist Parquet to Supabase Storage + metadata to Postgres
  → ask: table relevance → sample context → Groq (openai/gpt-oss-120b) generates SQL
  → validate (shared safety policy + workspace schema allowlist + EXPLAIN)
  → execute (paged) → optional plain-English analysis
```

Key properties:

- **Multi-table by default.** Relevance is detected automatically; joins only use detected relationships.
- **SELECT-only.** All generated SQL passes a shared safety policy (`lib/sql/sqlSafety.ts` + `validateSQL()`), a workspace schema allowlist, and `EXPLAIN` validation before execution. Export paths enforce the same invariant.
- **Transparent.** The UI shows generated SQL, warnings (e.g. schema truncation on large workspaces), and data notes per answer.

## Tech stack

- Next.js `^16.2.10`, React `^19.2.7`, Tailwind CSS v4, TypeScript (strict)
- DuckDB-WASM (`@duckdb/duckdb-wasm`) for in-browser query execution
- Groq SDK (`openai/gpt-oss-120b`) for SQL generation, repair, and analysis
- Supabase for auth, Postgres metadata (`datasets`, chat sessions/messages, `usage_turns`, caches), and Parquet file storage

## Getting started

Prerequisites: Node.js 20+, npm, a Supabase project, a Groq API key.

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:3000
```

### Environment variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client+server | yes | Supabase publishable key (safe for browser) |
| `GROQ_API_KEY` | server only | yes | Groq key for SQL generation (`lib/ai/client.ts` throws at boot if missing) |
| `NEXT_PUBLIC_DEBUG` | client | no | `true` enables verbose console logging (keep `false` in production) |
| `NEXT_PUBLIC_GA_ID` | client | no | Google Analytics ID; analytics disabled when unset |

Never commit `.env` (gitignored). Never expose `GROQ_API_KEY` to the client — all LLM calls go through `/api/chat` and `/api/fix-sql`.

### Backend setup (Supabase)

A fresh clone needs a configured Supabase backend — the app cannot run without it. All schema, policies, and quota logic live in `supabase/migrations/` (applied in filename order).

1. **Link the project to Supabase.** Create a project at [supabase.com](https://supabase.com), then link the local CLI:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
2. **Run the migrations.** This creates all tables (`datasets`, `chat_sessions`, `chat_messages`, `usage_turns`, `query_cache`, `explanation_cache`), enables RLS with per-user policies, and installs the `claim_turn` / `increment_turn_calls` quota functions plus owner-scoped `datasets` storage policies:
   ```bash
   npx supabase db push
   ```
3. **Create a PRIVATE storage bucket named `datasets`.** The app uploads Parquet files to `<userId>/<file>.parquet` and mounts them via signed URLs — the bucket must exist or uploads fail. (Dashboard: Storage → New bucket → name `datasets`, Private.)
4. **Enable email authentication.** Dashboard: Authentication → Providers → Email → enable.
5. **Configure the `/auth/callback` redirect.** Dashboard: Authentication → URL Configuration → add `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local dev) to Redirect URLs.
6. **Set `GROQ_API_KEY`.** Server-side only, in `.env` (local) and your hosting provider's env settings (production). Get a key at [console.groq.com](https://console.groq.com).
7. **Install dependencies and run:**
   ```bash
   npm install
   npm run dev   # http://localhost:3000
   ```

## Commands

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # start production server
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
```

## Usage & quota

- Upload CSV/XLSX files (up to 50MB each) from the workspace sidebar; Excel workbooks ingest every non-empty sheet as its own table.
- Ask analytical questions; page through results (100/page) or export up to 5,000 rows as CSV.
- **Free quota: 20 AI queries per user per day**, plus per-turn rate limiting (5/min) and an 8-call per-turn replay budget. Over-quota responses return HTTP 429 with a plain-language message.

## Security model

- Generated/user SQL boundary: safety policy → schema allowlist → `EXPLAIN` (8s timeout) → execution (8s timeout). Writes, extension loading (`INSTALL`/`LOAD`), `ATTACH`/`COPY`, remote file functions (`read_parquet`, `read_csv`, `httpfs`), and system catalogs are rejected.
- Per-user cache isolation: query and explanation cache keys are scoped by user id.
- User-facing errors are plain-language; raw engine/storage internals stay in server logs.
- Security headers (`nosniff`, `DENY`, `Referrer-Policy`, `HSTS`) are set in `next.config.ts`.

## Project structure

```
app/                  # App Router: landing, workspace, auth, api/chat, api/fix-sql, api/usage/quota
lib/upload/           # parsers, validation, normalization, DuckDB ingestion, metadata memory
lib/duckdb/           # WASM singleton, table creation, Parquet export, view mounting, rehydration
lib/metadata/         # semantic inference (roles, keywords, metrics, dataset context)
lib/ai/               # core (client orchestrators) / chat (server Groq executors) / prompts / tools
lib/sql/              # safety policy, schema allowlist, validation, EXPLAIN timeout, pagination
lib/cache/            # per-user query + explanation caches
lib/supabase/         # browser/server/middleware clients
components/           # workspace UI, landing, auth
public/duckdb/        # vendored DuckDB-WASM (~142MB, 83 files — intentional, see below)
types/                # chat, datasets, duckdb, toast
```

### Why is `public/duckdb/` tracked in git?

DuckDB-WASM binaries and workers are vendored (pinned to the `@duckdb/duckdb-wasm` version in `package.json`) so the app doesn't depend on a third-party CDN at runtime and works offline. Cost: a heavier clone (~142MB). If that becomes a problem, migrating this directory to Git LFS is the intended next step — the loading code (`lib/duckdb/duckdb.ts`) won't need to change.

## Third-party notices

- `xlsx` (SheetJS, Apache-2.0) is pinned to `0.20.3` via a versioned tarball for reproducible installs.
- UI: `radix-ui` (dropdown primitives), `lucide-react` (icons), `framer-motion` (animation), `tailwind-merge`/`tw-animate-css` (styling).

## License

MIT — see [LICENSE](LICENSE).
