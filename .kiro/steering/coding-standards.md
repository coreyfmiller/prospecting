---
inclusion: auto
---

# MarketMojo.ai — Coding Standards

## Language & Tooling
- TypeScript with `strict: true` — no `any` unless interfacing with untyped external APIs
- Next.js 16 App Router — all routes under `/app/`
- pnpm for package management (`pnpm add`, never `npm install`)
- Path alias: `@/*` maps to project root (e.g. `@/lib/db`, `@/components/ui/button`)

## File & Folder Conventions
- Pages: `/app/<route>/page.tsx` (server components by default)
- API routes: `/app/api/<name>/route.ts` — export named HTTP methods (`GET`, `POST`, etc.)
- Components: `/components/dashboard/` for feature components, `/components/ui/` for shadcn primitives
- Lib: `/lib/` for shared utilities, data layer, and scoring engine
- Hooks: `/hooks/` for custom React hooks (prefix with `use-`)
- Supabase clients: `/lib/supabase/client.ts` (browser) and `/lib/supabase/server.ts` (server/middleware)

## Component Patterns
- Mark client components with `"use client"` at the top — only when needed (event handlers, hooks, browser APIs)
- Keep server components as the default; push interactivity to the smallest leaf component
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes (clsx + tailwind-merge)
- Use shadcn/ui components from `@/components/ui/` — don't reinvent primitives
- Props interfaces go directly above the component, not in a separate types file (unless shared)

## Styling
- Tailwind CSS v4 with CSS variables for theming (light/dark via `next-themes`)
- No inline `style={}` unless absolutely necessary (e.g. dynamic values from data)
- Use the brand color palette from `color-palette.md` — reference CSS variables, not raw hex
- Score gauge colors: green (≥60), orange (30–59), red (<30)

## Data Layer
- Client-side Supabase: `createClient()` from `@/lib/supabase/client`
- Server-side Supabase: `createServerSupabase()` from `@/lib/supabase/server`
- Service role (admin): `createServiceClient()` from `@/lib/supabase/server`
- All DB functions live in `/lib/db.ts` — don't scatter Supabase queries across components
- Types for DB records: `DbBusiness`, `DbProject`, `DbAudit` (defined in `db.ts`)

## API Routes
- Always wrap handler body in `try/catch`
- Return `NextResponse.json(...)` with appropriate status codes
- Validate input early, return 400 with a user-friendly message
- Use `Promise.allSettled` for parallel external calls that can independently fail
- Gracefully degrade when optional services are unavailable (Moz, Perplexity)

## Error Handling
- `try/catch` with `console.error` for server-side logging
- Never expose raw error messages to the client — return sanitized messages
- Optional integrations (Moz, Perplexity) should fail silently and return defaults
- Empty `catch {}` is acceptable only for truly optional operations (meta tag extraction, etc.)

## TypeScript Conventions
- Export interfaces for API response shapes alongside the route file
- Use `type` for unions/aliases, `interface` for object shapes
- Prefer `const` over `let`; never use `var`
- Destructure props and function params
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks

## Async Patterns
- `async/await` everywhere — no raw `.then()` chains
- Use `Promise.allSettled` when running parallel calls that shouldn't block each other
- Use `Promise.all` only when all calls must succeed

## Naming
- Files: kebab-case (`lead-card.tsx`, `grader-v2.ts`)
- Components: PascalCase (`LeadCard`, `ScoreGauge`)
- Functions/variables: camelCase (`getProjects`, `searchText`)
- Interfaces/types: PascalCase (`DbBusiness`, `ScanResult`)
- Constants: UPPER_SNAKE_CASE for true constants (`SERVICE_TAGS`, `DEFAULT_CHAINS`)
- API route files: always `route.ts`

## Git & Deployment
- Single branch: `main`
- Auto-deploy via Vercel on push
- Environment variables managed in Vercel dashboard
- No build step for crawl-worker (deployed separately to Railway)
