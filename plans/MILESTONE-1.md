# Plan — M1: Planning & Architecture

**Milestone:** M1 · **Priority:** P0 · **Amount:** $220 · **Status:** done (2026-11-11)
**Owner agents:** architect (Opus) + planner — executed inline by the orchestrator this session.

## Goal
Lock the architecture and stand up an empty, convention-ready scaffold before any feature code.

## Scope / deliverables
- [x] `docs/ARCHITECTURE.md` — stack, repo layout, RBAC matrix, data model summary, ERD (mermaid), API surface, UX screens & flows, deployment plan.
- [x] `server/prisma/schema.prisma` — full PostgreSQL data model (14 models, enums, indexes, relations).
- [x] API endpoint map (in ARCHITECTURE §6).
- [x] RBAC permission matrix (in ARCHITECTURE §4).
- [x] UI screen inventory + primary user flows (in ARCHITECTURE §7).
- [x] Scaffold `client/` (Vite+React+TS+Tailwind) and `server/` (Express+TS+Prisma) — skeletons only (health endpoint + placeholder page).
- [x] Tooling: TS configs, ESLint (flat) + Prettier per app, `.env.example` per app, root scripts, `.gitignore`.
- [x] `docs/DECISIONS.md` seeded (ADR-001..006). `memory.md` seeded.
- [x] Claude workflow system: CLAUDE.md, MILESTONES.md, docs/*, agents, `/start` command.
- [x] git init + first commit. Push pending `gh auth login`.

## No feature code
Auth, profiles, shifts, etc. are **not** implemented here — they begin in M2.

## Decisions made (see DECISIONS.md)
PostgreSQL (not Mongo), Prisma, simple client/server (npm, no workspaces), JWT+refresh+RBAC, agent model tiers, Playwright interactive QA.

## Risks / notes
- `gh` not authenticated → GitHub push deferred until `gh auth login` is run.
- Dependencies not yet installed (`npm run install:all`) — first step of M2.
- Prisma migrations run in M2 once a Postgres DB is connected.

## Open decisions deferred to later milestones
File/object storage provider (M2), email/push providers (M4), hosting providers (M5), PR-vs-direct-commit at first push.

## Notes for QA
M1 is planning-only — no browser QA. Verification = scaffold integrity: configs valid, schema parses (`npx prisma validate` after install), apps build after `npm run install:all`. Deferred to M2 kickoff since deps aren't installed this session.
