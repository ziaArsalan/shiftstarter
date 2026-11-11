# Decision Records (ADRs)

Chronological. Each: context → decision → why. Only significant decisions.

## ADR-001 — PostgreSQL (not MongoDB)
**Context:** The reusable workflow template is written generically for MERN (MongoDB), but the Bobby Pharma quotation explicitly specifies PostgreSQL.
**Decision:** Use PostgreSQL. The project is PERN, not MERN.
**Why:** The quotation is the contract; data is highly relational (users↔shifts↔applications↔bookings↔payments). Confirmed with the client on 2026-11-11.

## ADR-002 — Prisma as ORM
**Decision:** Prisma over Drizzle / Knex.
**Why:** Best DX for this stack, type-safe client, declarative schema + straightforward migrations, pairs well with TypeScript across client/server. Confirmed 2026-11-11.

## ADR-003 — Simple `client/` + `server/` layout (no monorepo tooling)
**Context:** Template suggests a monorepo; mobile is future-only.
**Decision:** Two top-level folders, npm, no workspace tooling.
**Why:** Simplicity for a web-first, single-team build; avoids workspace overhead. Backend stays API-driven so mobile can be added later. Confirmed 2026-11-11.

## ADR-004 — JWT access + refresh with RBAC
**Decision:** Short-lived JWT access tokens + rotating refresh tokens (stored for revocation) + role-based middleware.
**Why:** Matches the quotation (JWT + RBAC); standard, stateless, mobile-friendly.

## ADR-005 — Agent model tiers (cost policy)
**Decision:** architect + developer = Opus; planner + qa-tester + bug-fixer = Sonnet; git-publisher = Haiku.
**Why:** Spend the strongest model only where reasoning quality drives outcomes (design + implementation); mechanical work (commits/changelog) runs on the cheapest model. Confirmed 2026-11-11.

## ADR-006 — QA via Playwright, interactive-driving
**Decision:** qa-tester drives Playwright step-by-step (text a11y snapshots), screenshots only on failure.
**Why:** Playwright is cheapest on tokens vs. browser/extension (text snapshots, not images) and reproducible. Interactive-driving chosen over script-first per user preference 2026-11-11.

---

### Open decisions (deferred, ask before deciding)
- **File/object storage provider** for credential documents (M2).
- **Email + push notification providers** (M4).
- **Hosting providers** for staging/production (M5).
- **PR-per-milestone vs direct commits to main** (confirm at first push).
