# Project Memory — Pharmacy Staffing Marketplace

Durable, portable knowledge for any Claude session on any machine. Keep concise. Add a significant reusable decision only with user approval.

## Identity
- Web-based **Pharmacy Staffing Marketplace** connecting workers/pharmacists with pharmacies/employers.
- Client: Bobby. Prepared by: Zia Arsalan. Fixed cost **$2,200**, 6–8 weeks, **5 milestones**.
- Source of truth: `QUOTATION - Bobby Pharma APP (1).pdf`.

## Stack (locked)
- **PERN**: React+Vite+Tailwind / Node+Express / **PostgreSQL + Prisma** / JWT+RBAC / Stripe.
- NOT MongoDB (the generic template said MERN; the contract says Postgres — see DECISIONS ADR-001).
- Layout: simple `client/` + `server/`, **npm**, no monorepo/workspace tooling.
- Roles: **WORKER · PHARMACY · ADMIN**.
- Mobile app is **future** — backend is API-driven to allow it; do not build mobile now.

## Workflow
- **Milestone/batch mode** (not granular tasks). Milestones M1–M5 in `MILESTONES.md`.
- Run via `/start` / `/start M2` / `/start M2 --skip-qa`.
- Pipeline: plan → **approve** → develop → QA → (bugs → **approve** → fix → retest) → changelog → commit → push. See `docs/WORKFLOW.md`.
- Two approval gates on by default (`approval_required: true`); designed to be flippable later.

## Agent model tiers (cost policy)
- architect, developer = **opus**; planner, qa-tester, bug-fixer = **sonnet**; git-publisher = **haiku**.

## Environment notes
- Node 22, npm 10, git, psql 14, Docker 28 present on the dev machine (2026-11-11).
- **GitHub remote:** `git@github.com:devtronics-co/pharmacy-staffing.git` (origin). Push over **SSH** (key `ziaArsalan` works); `gh` CLI is NOT authenticated and HTTPS has no stored credential — use SSH for push.
- QA: Playwright **interactive-driving**; installed locally in M2 when first needed.

## Conventions
- API under `/api/v1`, errors as `{ error: { code, message } }`.
- Never commit secrets (`.env*` except `.env.example`).
- Ask before: new significant dependency, DB-destructive change, security/infra/architecture change, production deploy, force-push.

## Status log
- 2026-11-11: Workflow system set up; **M1 (Planning & Architecture)** executed — architecture, Prisma data model + ERD, API map, RBAC matrix, UX flows, and empty client/server scaffold.
