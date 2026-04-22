---
inclusion: auto
---

# MarketMojo.ai — Project Steering

## What This Is
MarketMojo.ai is a local business prospecting tool for web agencies and freelancers. It helps users find businesses in any area, audit their web presence, and build a sales pipeline.

## Tech Stack
- Next.js 16 (App Router) on Vercel
- Supabase (auth + database)
- Tailwind CSS v4 + shadcn/ui components
- Google Places API + Perplexity for business search
- Gemini AI (2-call averaged, temperature 0) for semantic content analysis
- Playwright crawl worker on Railway for JS-rendered page crawling
- Moz API for domain authority metrics
- pnpm package manager

## Key Architecture
- `/app/api/duelly-scan/` — SEO & AI Visibility scan endpoint (full scoring pipeline)
- `/lib/scoring/` — Duelly-ported scoring engine (crawler, grader-v2, Gemini analyzer, site-type detector, scoring components)
- `/crawl-worker/` — Standalone Playwright service deployed to Railway
- `/lib/db.ts` — Supabase data layer (businesses, projects, audits)
- `/lib/blocklist.ts` — Chain business filtering
- `/components/dashboard/lead-card.tsx` — Main business card component with scan results

## Scoring Pipeline
1. Crawl via Playwright worker (or fetch+cheerio fallback)
2. Detect site type (schema + content + URL signals)
3. Gemini AI analysis (2 parallel calls, averaged semantic flags 0-100)
4. Grader V2: SEO (100pts component-based), AEO (100pts graduated), GEO (100pts graduated)
5. Moz DA lookup (parallel with Gemini)

## Branding Rules
- Product name: **MarketMojo.ai**
- Never reference "Duelly" in user-facing UI except "Powered by" attribution on scan results
- GEO score is labeled **"AI Visibility (GEO)"** in the UI
- Scan button says **"SEO & AI Scan"** not "Duelly Scan"
- Report header says **"Site Report"** not "Duelly Report"

## Environment Variables (Vercel)
- `GEMINI_API_KEY` — Google Generative AI
- `CRAWL_WORKER_URL` — Railway Playwright worker URL
- `CRAWL_WORKER_SECRET` — Railway worker auth token
- `MOZ_API_TOKEN` — Moz API (optional, gracefully degrades)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PLACES_API_KEY` / `PERPLEXITY_API_KEY` / `SERPER_API_KEY`

## UX Rules
- Dismissed businesses are always hidden (no toggle) — view them at /dismissed
- "Hide big chains" is a clickable toggle on search and database pages
- Score gauges use circular progress rings with three color tiers
- All commits go to main branch, auto-deploy via Vercel
