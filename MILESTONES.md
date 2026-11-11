# Milestones — Pharmacy Staffing Marketplace

Batch unit of work = **one milestone**. Priorities: P0 critical → P3 low.
Statuses: `pending` · `in_progress` · `qa` · `blocked` · `done`.
Run with `/start`, `/start M2`, or `/start M2 --skip-qa`.

Billing/scope map to the quotation ($2,200 total).

---

## M1 — Planning & Architecture
- **Priority:** P0
- **Depends on:** —
- **Status:** done (2026-11-11 — committed locally `7782ab7`; GitHub push pending `gh auth login`)
- **Amount:** $220
- **Goal:** Lock the architecture before any feature code.
- **Deliverables:** `docs/ARCHITECTURE.md`; Prisma data model + ERD; API endpoint map; RBAC permission matrix; UI screen inventory + primary user flows; empty `client/` + `server/` scaffold with tooling (TS, lint, format, env); `docs/DECISIONS.md` + `memory.md` seeded.
- **No feature code.**
- **Plan:** [plans/MILESTONE-1.md](plans/MILESTONE-1.md)

## M2 — Core Platform & User Roles
- **Priority:** P0
- **Depends on:** M1
- **Status:** pending
- **Amount:** $550
- **Goal:** Auth + roles + profiles + credentials foundation.
- **Scope:** JWT auth + RBAC (worker / pharmacy / admin); registration & login; worker profiles; pharmacy profiles + locations; credential/document upload (storage wiring); base admin dashboard shell; responsive web shell; core API + DB migrations live.

## M3 — Shifts, Search, Applications & Bookings
- **Priority:** P1
- **Depends on:** M2
- **Status:** pending
- **Amount:** $550
- **Goal:** The marketplace core loop.
- **Scope:** Shift creation/management; search + advanced filters; location/radius search; applications workflow; booking workflow; availability & role-based matching.

## M4 — Payments, Messaging, Notifications & Verification
- **Priority:** P1
- **Depends on:** M3
- **Status:** pending
- **Amount:** $500
- **Goal:** Launch-enabling features.
- **Scope:** Stripe payments & payouts + transaction tracking; worker/employer messaging; email + push notifications; ratings & reviews; credential verification workflow (approve/reject).

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
