# Decision Records (ADRs)

Chronological. Each: context → decision → why. Only significant decisions.

## ADR-001 — PostgreSQL (not MongoDB)  — ⚠️ partially superseded by ADR-008
**Context:** The reusable workflow template is written generically for MERN (MongoDB), but the Bobby Pharma quotation explicitly specifies PostgreSQL.
**Decision:** Use PostgreSQL. The project is PERN, not MERN.
**Why:** The quotation is the contract; data is highly relational (users↔shifts↔applications↔bookings↔payments). Confirmed with the client on 2026-11-11.
**Update (2026-11-12):** PostgreSQL remains; the *hosting/provider* decision (raw self-hosted Postgres) is superseded by **ADR-008 (Supabase-managed Postgres)**.

## ADR-002 — Prisma as ORM
**Decision:** Prisma over Drizzle / Knex.
**Why:** Best DX for this stack, type-safe client, declarative schema + straightforward migrations, pairs well with TypeScript across client/server. Confirmed 2026-11-11.

## ADR-003 — Simple `client/` + `server/` layout (no monorepo tooling)
**Context:** Template suggests a monorepo; mobile is future-only.
**Decision:** Two top-level folders, npm, no workspace tooling.
**Why:** Simplicity for a web-first, single-team build; avoids workspace overhead. Backend stays API-driven so mobile can be added later. Confirmed 2026-11-11.

## ADR-004 — JWT access + refresh with RBAC  — ❌ SUPERSEDED by ADR-009
**Decision:** Short-lived JWT access tokens + rotating refresh tokens (stored for revocation) + role-based middleware.
**Why:** Matches the quotation (JWT + RBAC); standard, stateless, mobile-friendly.
**Superseded (2026-11-12):** Custom JWT/argon2/refresh-token auth is replaced by **Supabase Auth (ADR-009)**. The M2 v1 implementation (`RefreshToken` model, `lib/tokens.ts`, argon2 hashing) is a checkpoint only and is removed in the M2 rebuild. RBAC survives but is re-expressed over Supabase JWT claims + `Profile`/`Membership` (ADR-010).

## ADR-005 — Agent model tiers (cost policy)
**Decision:** architect + developer = Opus; planner + qa-tester + bug-fixer = Sonnet; git-publisher = Haiku.
**Why:** Spend the strongest model only where reasoning quality drives outcomes (design + implementation); mechanical work (commits/changelog) runs on the cheapest model. Confirmed 2026-11-11.

## ADR-006 — QA via Playwright, interactive-driving
**Decision:** qa-tester drives Playwright step-by-step (text a11y snapshots), screenshots only on failure.
**Why:** Playwright is cheapest on tokens vs. browser/extension (text snapshots, not images) and reproducible. Interactive-driving chosen over script-first per user preference 2026-11-11.

---

## ADR-007 — Credential storage: Supabase Storage (resolves the M1 open "storage provider")
**Context:** M1 deferred the object-storage choice; M2 v1 shipped a local-disk impl behind a `StorageProvider` interface.
**Decision:** Use **Supabase Storage** (private `credentials` bucket) as the production storage, keeping the existing `StorageProvider` interface and swapping the local-disk impl for a Supabase impl. Public `brand-assets` bucket for chain logos.
**Why:** Full Supabase adoption (ADR-008) makes Storage the native, no-extra-vendor choice; private buckets + signed URLs preserve the "no public URLs / authenticated download" rule. Confirmed in direction with the client 2026-11-12. Supersedes the "local disk now, S3 in M5" recommendation in plans/MILESTONE-2 (v1).

## ADR-008 — Supabase-managed PostgreSQL (full adoption)
**Context:** Client call 2026-11-12 — Bobby wants to self-serve DB visibility and build an ecosystem (incl. a Lovable app) on one Supabase account; asked which is better.
**Decision:** Adopt **Supabase** as the managed Postgres + platform (DB, Auth, Storage). Prisma is retained for schema/migrations and business-logic queries against the Supabase connection string (pooled `DATABASE_URL` + `DIRECT_URL` for migrations). RLS policies authored as SQL.
**Why:** Managed Postgres with a friendly console, native Auth + Storage + RLS, and room for the client's wider ecosystem; still standard Postgres so Prisma is unaffected. Supersedes the self-hosted-Postgres hosting assumption of ADR-001.

## ADR-009 — Supabase Auth replaces custom JWT auth
**Context:** With full Supabase adoption, maintaining a parallel custom auth stack is redundant and higher-risk.
**Decision:** Use **Supabase Auth** for sign-up/in/out, sessions, and password reset. The client uses `@supabase/supabase-js`; Express verifies the Supabase access token via **JWKS** on protected routes. Drop the custom JWT issuance, rotating refresh tokens (`RefreshToken` model), and argon2 hashing.
**Why:** Less bespoke security surface, free session/refresh/reset/email flows, native RLS integration. Supersedes ADR-004. **New dependencies to approve before the rebuild:** `@supabase/supabase-js` (client + server) and a JWKS/JWT verifier (`jose`).

## ADR-010 — Multi-tenant SaaS model with expanded roles
**Context:** Client clarified the real role structure in the call.
**Decision:** Replace flat WORKER/PHARMACY/ADMIN with: **SUPER_ADMIN** (platform), **Organization** tenants whose members hold **OWNER/MANAGER** via a `Membership`, and individual **worker roles** PHARMACIST / PHARMACY_TECHNICIAN / PHARMACY_ASSISTANT / PHARMACY_STUDENT. Tenant isolation via **Supabase RLS** (client path) + Express service-layer scoping (API path). `Profile.id` = Supabase auth UUID.
**Why:** Matches the client's domain (chains with multiple staff/locations; cross-tenant super admin); scales to multiple orgs per account and the client's ecosystem ambitions.

## ADR-011 — Rewards via internal ledger + Blackhawk gift-card API
**Context:** Rewards are the client's core growth hook ("nobody else is doing rewards").
**Decision:** Design now, **build in M3**. Internal ledger (`RewardAccount` + immutable `RewardTransaction` EARN/REDEEM/ADJUST, idempotent per booking) with a configurable `RewardPolicy` (default $5 / 500 cents CAD). Redemption via the **Blackhawk** developer API (request card, track status, store external refs). EARN only on `Booking` → COMPLETED; CANCELLED/NO_SHOW excluded.
**Why:** Blackhawk has a developer API and a large Canadian gift-card catalog → good redemption UX; a ledger keeps balances auditable and decoupled from the provider. **M3 prerequisite:** Blackhawk developer account + API keys + sandbox (client-provided).

## ADR-012 — Pharmacy-chain branding catalog
**Context:** Bobby wants clean, brand-forward shift listings showing chain logos; Canada skews to chain pharmacies.
**Decision:** Add a platform-curated **`PharmacyChain`** catalog (name, slug, logo), managed by SUPER_ADMIN, readable by all authenticated users. Organizations/locations reference a chain; independents leave it null. Capture a clean-UX guideline for M3 shift listings.
**Why:** Recognisable branding + uncluttered listings is a stated differentiator vs competitors; a shared catalog keeps logos consistent and lets independents opt out.

---

### Open decisions (deferred, ask before deciding)
- **Super admin mechanism** — Supabase user with an `app_metadata` `platform_role=SUPER_ADMIN` claim mirrored into `Profile.platformRole` (recommended), vs a separate mechanism. (ADR-010 assumes the claim approach.)
- **First-login provisioning** — Express `POST /auth/bootstrap` vs a Supabase DB trigger that creates the `Profile` on `auth.users` insert.
- **Prisma under RLS** — treat Express as a trusted tier enforcing tenant scoping in code (recommended), vs propagating JWT claims to Postgres so Prisma also runs under RLS.
- **Reward policy scope & eligibility** — platform-only default vs per-org override; exact eligible statuses (COMPLETED only) and any anti-abuse rules (per-worker caps, clawback on dispute).
- **Workers belonging to agencies** — keep workers always independent (recommended now) vs enabling `OrganizationType.AGENCY` tenants later.
- **New dependencies to approve before the M2 rebuild** — `@supabase/supabase-js`, `jose` (JWKS verify); remove `jsonwebtoken`, `argon2`/`bcryptjs`, `cookie-parser` from the M2 v1 set.
- **Email + push notification providers** (M4) — note Supabase Auth covers auth emails; marketing/transactional email still open.
- **Hosting provider** for the Node API in staging/production (M5); Supabase covers DB/Auth/Storage.
- **PR-per-milestone vs direct commits to main** (confirm at first push).

### User prerequisites (cannot be created by the build)
- **Supabase project(s)** (staging + production) + URL, anon key, service-role key, DB connection strings.
- **Blackhawk** developer account + API keys + sandbox (M3).
- **Stripe** keys for testing (M4, as previously noted).
- **Pharmacy-chain logos** for the catalog (client to supply).
