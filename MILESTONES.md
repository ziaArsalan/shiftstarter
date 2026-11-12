# Milestones — Pharmacy Staffing Marketplace

Batch unit of work = **one milestone**. Priorities: P0 critical → P3 low.
Statuses: `pending` · `in_progress` · `qa` · `blocked` · `done`.
Run with `/start`, `/start M2`, or `/start M2 --skip-qa`.

Billing/scope map to the quotation ($2,200 total).

> **Commercial note (2026-11-12, for the user — not an engineering decision).** The 2026-11-12 client call added scope beyond the original $2,200 / 5-milestone quotation: **Supabase adoption**, a **multi-tenant SaaS model** (orgs + memberships + super admin), a **rewards system** (ledger + Blackhawk gift-card redemption), and **pharmacy-chain branding**. The milestone amounts below are left at their original figures; the added scope should be addressed commercially (re-quote or change-order) with the client. See docs/DECISIONS.md ADR-008..ADR-012.

---

## M1 — Planning & Architecture
- **Priority:** P0
- **Depends on:** —
- **Status:** done (2026-11-11 — committed & pushed to origin/main)
- **Amount:** $220
- **Goal:** Lock the architecture before any feature code.
- **Deliverables:** `docs/ARCHITECTURE.md`; Prisma data model + ERD; API endpoint map; RBAC permission matrix; UI screen inventory + primary user flows; empty `client/` + `server/` scaffold with tooling (TS, lint, format, env); `docs/DECISIONS.md` + `memory.md` seeded.
- **No feature code.**
- **Plan:** [plans/MILESTONE-1.md](plans/MILESTONE-1.md)

## M2 — Core Platform & Multi-Tenant Roles (Supabase rebuild)
- **Priority:** P0
- **Depends on:** M1
- **Status:** in_progress — v1 (custom JWT auth, 3-role, local Postgres) committed as a **checkpoint** on 2026-11-12. **Rebuilding** on Supabase (Auth + RLS + Storage + SDK) with the multi-tenant SaaS role model per the 2026-11-12 client call. See DECISIONS.md ADR-008..ADR-012 and plans/MILESTONE-2.md.
- **Amount:** $550 (see commercial note — added scope)
- **Goal:** Supabase auth + multi-tenant orgs/roles + profiles + credentials foundation.
- **Scope:** Supabase Auth (sign-up/in/out, session, reset) via `supabase-js`; Express JWKS verification + RBAC; `Profile` provisioning; **Organizations + Memberships (OWNER/MANAGER)**; worker profiles (4 worker roles); org locations; credential upload on **Supabase Storage**; **super-admin portal shell** (users, orgs, credential queue); pharmacy-chain catalog (super-admin CRUD + selection); responsive web shell; schema migrated to Supabase + RLS policies live.
- **Rewards:** data model only (schema present); earn/redeem logic deferred to M3.

## M3 — Marketplace Core Loop, Rewards & Branding
- **Priority:** P1
- **Depends on:** M2
- **Status:** pending
- **Amount:** $550 (see commercial note — rewards/Blackhawk/branding are added scope)
- **Goal:** The marketplace loop plus the rewards hook and brand-forward listings.
- **Proposed split (flag for approval):**
  - **M3a — Core loop:** shift creation/management; search + advanced filters; location/radius search; applications workflow (incl. rate negotiation field); booking workflow; availability & role-based matching; clean/brand-forward shift listings (chain logo).
  - **M3b — Rewards + branding polish:** reward EARN on COMPLETED (ledger), balance/history UI, redemption via **Blackhawk** (catalog, request, status), reward policy admin; finish chain-branding surfaces.
- **M3b prerequisite:** Blackhawk developer account + API keys + sandbox (client-provided).
- **Note:** rewards were folded into M3 per the client. If M3a+M3b overflows the milestone, propose promoting rewards to its own milestone (commercial).

## M4 — Payments, Messaging, Notifications & Verification
- **Priority:** P1
- **Depends on:** M3
- **Status:** pending
- **Amount:** $500
- **Goal:** Launch-enabling features.
- **Scope:** Stripe payments & payouts (CAD) + transaction tracking; worker/employer messaging; email + push notifications; ratings & reviews; credential verification workflow (approve/reject) — super-admin reviewed. (Supabase Auth already covers auth emails.)

## M5 — QA, Deployment, Launch & Handover
- **Priority:** P2
- **Depends on:** M4
- **Status:** pending
- **Amount:** $380
- **Goal:** Ship it.
- **Scope:** Full regression QA; security & performance hardening; dispute & cancellation management; analytics & reporting; staging + production deploy; documentation & handover.

---

### Selection rules (for `/start` with no ID)
1. Only milestones whose **dependencies are `done`** are eligible.
2. Among eligible, pick highest priority (P0 → P3), then lowest number.
3. Never select a milestone with unmet dependencies.
