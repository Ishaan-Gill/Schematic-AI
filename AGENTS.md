<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Conventions for OpenCode Agents

This document outlines essential information for OpenCode agents to work effectively in this repository.

## Project Overview

**Schematic AI** is an AI-powered financial analytics SaaS. Users upload messy business datasets (CSV/XLSX, multi-file, multi-sheet), ask questions in plain English, and receive verified, SQL-backed answers — not hallucinated numbers. The core differentiator is reliable multi-table reasoning over messy real-world data, with full transparency into how each answer was derived (SQL used, tables joined, warnings, assumptions).

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

- There is no explicit `test` script defined in `package.json`. Agents should prioritize `npm.cmd run lint` and `npx tsc --noEmit` for code quality verification.
- Always refer to `node_modules/next/dist/docs/` for up-to-date Next.js documentation and heed deprecation notices due to significant breaking changes in this Next.js version.
- Before considering a task complete, run both lint and typecheck.

## Entry Points and Key Files

- Main page entry point: `app/page.tsx`


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
- Gate debug logging behind the shared `DEBUG` constant from `lib/config/debug.ts`.
- Before considering a task complete, run:
  - `npm.cmd run lint`
  - `npx tsc --noEmit`

## Refactoring Policy

Do not perform architectural refactors unless explicitly requested.

When implementing features or fixing bugs:

- change the minimum amount of code necessary
- preserve existing patterns
- avoid moving files between folders
- avoid changing public function signatures unless required

If a better architecture is discovered during implementation, explain it first instead of silently refactoring.
