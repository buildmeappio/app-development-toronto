# App Development Toronto

A Clutch-style directory of app development companies across the Greater Toronto
Area (Ontario, Canada). Curated company profiles, ranked per location on both an
all-time and monthly basis. Companies claim their profiles for free; monetization
comes from featured placements and verified badges.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind)
- **Supabase** — Postgres, Auth (claim flow), Storage (logos/portfolio)
- **Drizzle ORM** — schema, migrations, queries
- **Google Places API** — primary curation source
- **Vercel** — hosting + Cron (monthly ranking snapshots)

## Setup

1. Copy env and fill in Supabase + Google values:
   ```bash
   cp .env.example .env.local
   ```
   You need the pooled `DATABASE_URL` (port 6543) and direct `DIRECT_URL`
   (port 5432) from Supabase → Project Settings → Database.

2. Push the schema and seed the GTA geography:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Run it:
   ```bash
   npm run dev
   ```

## Data model

| Table | Purpose |
|-------|---------|
| `locations` | Self-referential GTA tree: metro → region → city → district |
| `companies` | Curated firms + Google Places signals + claim status |
| `company_locations` | M2M driving the SEO page matrix (`headquartered` vs `serves`) |
| `ranking_snapshots` | Materialized rankings per (location, period) |
| `profiles` / `claims` | Supabase auth mirror + free claim requests |
| `placements` | Paid featured slots and verified badges |

## URL taxonomy

```
/                                            GTA hub
/app-development-companies/toronto            all-time ranking (canonical)
/app-development-companies/toronto/2026/08     monthly snapshot (dated archive)
/app-development-companies/peel/mississauga    nested city page
/company/[slug]                                claimable company profile
```

## Ranking

Scoring lives in `src/lib/ranking.ts` — a pure, documented function combining
Google review quality, profile completeness, tenure, and a claimed bonus.
**Paid placements never mutate the score**; they render as labeled sponsored
slots. Snapshots are materialized monthly (Vercel Cron), not computed per request.

## Roadmap

- **Phase 0 — Foundation** ✅ schema, GTA tree, DB/Supabase wiring, core pages
- **Phase 1 — Curation** — Google Places ingestion → companies + company_locations
- **Phase 2 — Ranking + SEO** — monthly snapshot cron, JSON-LD, sitemaps
- **Phase 3 — Claim + monetization** — domain-match claim flow, Stripe placements
- **Phase 4 — Reviews** — first-party verified reviews folded into ranking
