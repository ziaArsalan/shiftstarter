# Project Memory — Pharmacy Staffing Marketplace

Durable, portable knowledge for any Claude session on any machine. Keep concise. Add a significant reusable decision only with user approval.

## Identity
- Product: **ShiftStarter** (stylized "ShiftStarter AI"). Domain: **shiftstarter.ca**. Racing/"fast start" brand (checkered flag + speed swoosh).
- Web-based **pharmacy staffing marketplace** connecting workers/pharmacists with pharmacies/employers.
- Client: Bobby. Prepared by: Zia Arsalan. Fixed cost **$2,200**, 6–8 weeks, **5 milestones**.
- Source of truth: `QUOTATION - Bobby Pharma APP (1).pdf`. Brand: `docs/BRAND.md`.
- Brand colors: navy `#0A2A5E`, blue `#1565E0`, azure `#2E9BFF` on white (in `client/tailwind.config.js` as `brand.*`). Logo: `client/public/shiftstarter-logo.png`.
- Internal identifiers (GitHub repo `pharmacy-staffing`, npm package names) stay as-is; only user-facing name is ShiftStarter.

## Stack (pivoted 2026-11-12 — see DECISIONS ADR-007..012)
- Frontend: React+Vite+Tailwind. Backend: Node+Express (**hybrid**). ORM: **Prisma**. Payments: Stripe (M4).
- **Supabase = DB + Auth + Storage** (full adoption). Supabase-managed Postgres; **Supabase Auth** (client via `supabase-js`; Express verifies JWT via JWKS/`jose`) — replaced the old custom JWT/argon2 auth. Credential files in **Supabase Storage** (same `StorageProvider` interface). RLS on client path + Express service-layer tenant scoping on API path.
- **Multi-tenant SaaS roles:** platform `SUPER_ADMIN`; `Organization` tenants with `Membership` OWNER/MANAGER; worker professions enum PHARMACIST / PHARMACY_TECHNICIAN / PHARMACY_ASSISTANT / PHARMACY_STUDENT. (Replaced the old flat WORKER/PHARMACY/ADMIN.)
- **Rewards** (design done, build M3): ledger + Blackhawk gift-card redemption, default $5 CAD on Booking→COMPLETED. **PharmacyChain** branding catalog (logos on listings).
- Layout: simple `client/` + `server/`, **npm**, no monorepo tooling. Mobile app is **future** (API-driven).
- History: started PERN raw Postgres + custom JWT (ADR-001/004) — those are superseded; the raw-Postgres custom-auth M2 is saved at git tag `m2-checkpoint-custom-auth`.

## Workflow
- **Milestone/batch mode** (not granular tasks). Milestones M1–M5 in `MILESTONES.md`.
- Run via `/start` / `/start M2` / `/start M2 --skip-qa`.
- Pipeline: plan → **approve** → develop → QA → (bugs → **approve** → fix → retest) → changelog → commit → push. See `docs/WORKFLOW.md`.
- Two approval gates on by default (`approval_required: true`); designed to be flippable later.

## Agent model tiers (cost policy)
- architect, developer = **opus**; planner, qa-tester, bug-fixer = **sonnet**; git-publisher = **haiku**.

## Environment notes
- Node 22, npm 10, git, psql 14, Docker 28 present on the dev machine (2026-11-11).
- **GitHub remote:** `git@github.com:ziaArsalan/shiftstarter.git` (origin; shared privately with the client). Push over **SSH** (key `ziaArsalan` works); `gh` CLI is NOT authenticated — use SSH for push.
- **Supabase/Blackhawk/Stripe keys are client prerequisites** — not yet provided. M2 rebuild is blocked until the Supabase project + keys exist. Meeting transcripts are gitignored (sensitive).
- QA: Playwright **interactive-driving**; Chromium browser installed (2026-11-11).

## Local dev setup (M2 prep, 2026-11-11)
- Deps installed (client + server). Prisma client generated. Both apps build clean; server `/health` OK.
- **Dev DB:** Docker container `pharmacy-postgres` → `postgres:16`, mapped **host port 5433** (5432 was taken by a local Postgres). Creds `postgres/postgres`, db `pharmacy_marketplace`. Start/stop: `docker start|stop pharmacy-postgres`.
- Initial migration `20261111110629_init` applied — all 16 tables created.
- **`server/.env` is NOT committed and the tool is blocked from writing it** (settings deny). It must exist locally with `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pharmacy_marketplace?schema=public"` + JWT dev secrets. Create by hand.

## Conventions
- API under `/api/v1`, errors as `{ error: { code, message } }`.
- Never commit secrets (`.env*` except `.env.example`).
- Ask before: new significant dependency, DB-destructive change, security/infra/architecture change, production deploy, force-push.

## Status log
- 2026-11-11: Workflow system set up; **M1 (Planning & Architecture)** executed — architecture, Prisma data model + ERD, API map, RBAC matrix, UX flows, and empty client/server scaffold.
- 2026-11-12: **M2 v1** built (custom JWT auth, 3-role, local Postgres) — verified green, committed as checkpoint + tag `m2-checkpoint-custom-auth`. Client call added major scope → **architecture pivot** (Supabase, multi-tenant SaaS, rewards, chain branding) approved; docs/schema/milestones revised.
- Next: await Supabase project + keys, then **rebuild M2** on Supabase per the revised `plans/MILESTONE-2.md`.
