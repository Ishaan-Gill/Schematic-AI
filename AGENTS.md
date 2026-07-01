<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Conventions for OpenCode Agents

This document outlines essential information for OpenCode agents to work effectively in this repository.

## Project Overview

**Schematic.ai** is an AI-powered financial analytics SaaS. Users upload messy business datasets (CSV/XLSX, multi-file, multi-sheet), ask questions in plain English, and receive verified, SQL-backed answers — not hallucinated numbers. The core differentiator is reliable multi-table reasoning over messy real-world data, with full transparency into how each answer was derived (SQL used, tables joined, warnings, assumptions).

This is not a "chat with your CSV" wrapper. The pipeline does: file parsing → normalization → ingestion into DuckDB → profiling → semantic inference → SQL generation via LLM → validation → execution → (optionally) plain-English summarization of results.

## Framework and Versioning

- Next.js version `16.2.4`, bootstrapped with `create-next-app`
- React version `19.2.4`
- Tailwind CSS version `^4`
- TypeScript throughout
- DuckDB (WASM) for local, in-browser query execution
- Groq SDK (`llama-3.3-70b-versatile`) for SQL generation
- Supabase for auth, Postgres metadata, and file storage

## Core Developer Commands

- **Start Development Server:** `npm run dev` (opens on `http://localhost:3000`)
- **Build for Production:** `npm run build`
- **Start Production Server:** `npm run start`
- **Lint Code:** `npm run lint`
- **Type Check:** `npx tsc --noEmit`

## Testing and Verification

- There is no explicit `test` script defined in `package.json`. Agents should prioritize `npm run lint` and `npx tsc --noEmit` for code quality verification.
- Always refer to `node_modules/next/dist/docs/` for up-to-date Next.js documentation and heed deprecation notices due to significant breaking changes in this Next.js version.
- Before considering a task complete, run both lint and typecheck.

## Entry Points and Key Files

- Main page entry point: `app/page.tsx`

## Folder Structure

```
app/
  api/
    edit-sql/route.ts        # follow-up query editing (uses lastSQL context)
    fix-sql/route.ts         # error recovery — fixes broken SQL
    generate-sql/route.ts    # primary SQL generation endpoint
    suggest-fix/route.ts     # suggests fixes without auto-applying
  layout.tsx
  page.tsx                   # main app shell

components/
  ui/
    ActionRow.tsx
    button.tsx
    ChatMessages.tsx
    ChatPanel.tsx
    FileUpload.tsx
    resultTable.tsx
    Sidebar.tsx
    ThinkPanel.tsx            # displays SQL, tables used, joins, warnings
    Toast.tsx
    ToastContainer.tsx

lib/
  ai/
    detectTableRelevance.ts
    followUp.ts               # detects follow-up vs new query, time-based queries
    relationships.ts          # multi-table relationship/join detection
    relationshipsMap.ts       # relationship storage/types
    validations.ts            # SQL response validation logic

  export/
    exportCsv.ts
    exportXlsx.ts

  metadata/
    buildDatasetContext.ts    # builds semantic context sent to the LLM
    inferDateFormat.ts
    inferMetrics.ts
    inferSemanticRole.ts      # classifies columns (financial, temporal, id, etc.)
    semanticInference.ts      # (file: semanticInference.ts) table-level semantic context
    semanticKeywords.ts       # shared keyword lists used across semantic files
    types.ts

  security/
    checkRateLimit.ts

  sql/
    buildExecutableSQL.ts
    fixQuery.ts
    generateSQL.ts            # orchestrates the SQL generation flow (frontend-facing)
    recoverFailedQuery.ts
    runQuery.ts                # executes SQL against DuckDB, handles feedback memory
    suggestFix.ts
    validateQueryResult.ts
    validateSQL.ts             # blocks dangerous SQL, enforces SELECT-only

  upload/
    handlers/
      handleFileUpload.ts
      processFile.ts
    ingestion/
      createDuckTable.ts
      ingestParsedTable.ts     # main ingestion orchestrator
      profileTable.ts          # computes row/null/unique counts per column
    metadata/
      datasetMemory.ts         # in-memory store: schema, profile, semantic, relationships
      detectRelationships.ts
      feedbackMemory.ts        # stores success/failure query history (capped)
      profileMemory.ts
      schemaMemory.ts
    normalization/
      cleanValues.ts           # null placeholder cleanup
      inferColumnTypes.ts
      normalizeHeaders.ts
      normalizeTableName.ts
    parsers/
      parseCSV.ts
      parseExcel.ts
    validation/
      validateFile.ts          # file size/type checks (must be called in processFile)
      validateTable.ts          # row/column count checks
    uploadDataset.ts

  utils/
    quoteIdentifier.ts

  duckdb.ts                    # DuckDB connection singleton
  rateLimiter.ts
  supabase.ts
  utils.ts

types/
  index.ts
  message.ts
  toast.ts
```

## Architecture Notes

### Development Philosophy

- Understand the existing implementation before making changes.
- Explain the root cause before proposing code changes for non-trivial tasks.
- Prefer the smallest change that solves the problem.
- Preserve the existing architecture unless explicitly asked to refactor.
- Never rewrite working code just because a "cleaner" implementation exists.

### UI State

Assistant messages own their own UI state.

Each assistant message contains:

- loading
- error
- generatedSQL
- queryResult
- page
- hasMore

Avoid introducing global state for these properties.

Global state should only contain application-level concerns such as:

- sessions
- uploaded datasets
- authentication
- global notifications (toast)

### SQL Safety

- SQL is SELECT-only.
- Never generate UPDATE, DELETE, INSERT, DROP, ALTER, CREATE, or TRUNCATE statements.
- Every generated SQL query must pass through `validateSQL()` before execution.
- Never interpolate raw identifiers into SQL. Always use the shared escaping utility.

### Multi-table Architecture

- Multi-table reasoning is the default.
- Never assume a single active table.
- Table relevance is determined automatically.

### Semantic Layer

The semantic layer is one of the core differentiators of this product.

When modifying semantic inference:

- Keep `inferSemanticRole.ts`
- `semanticInference.ts`
- `semanticKeywords.ts`

consistent with each other.

### AI Safety

Never fabricate:

- schema
- table names
- column names
- relationships

Inspect existing code before making assumptions.

### Existing Technical Debt

Some files intentionally contain:

- `any`
- legacy helpers
- temporary workarounds

Do not rewrite them unless directly related to the task.

## Environment Variables

- `GROQ_API_KEY` — server-side only, never exposed to the client
- Supabase keys — service role key is server-side only; anon key is safe for client use

## Conventions

- Prefer explicit types over `any` in new code.
- Reuse existing helpers before introducing new abstractions.
- Do not add new dependencies without explicit approval.
- Do not rename files, folders, or exported APIs unless explicitly requested.
- User-facing errors must be plain-language and never expose internal stack traces.
- Gate debug logging behind `process.env.NEXT_PUBLIC_DEBUG === "true"`.
- Before considering a task complete, run:
  - `npm run lint`
  - `npx tsc --noEmit`

## Refactoring Policy

Do not perform architectural refactors unless explicitly requested.

When implementing features or fixing bugs:

- change the minimum amount of code necessary
- preserve existing patterns
- avoid moving files between folders
- avoid changing public function signatures unless required

If a better architecture is discovered during implementation, explain it first instead of silently refactoring.
