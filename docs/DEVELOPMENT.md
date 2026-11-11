# Development Standards & Setup

## Repo layout
```
client/   React + Vite + TypeScript + Tailwind  (dev: http://localhost:5173)
server/   Node + Express + TypeScript + Prisma   (dev: http://localhost:4000)
server/prisma/schema.prisma   — data model (source of truth for the DB)
```
Simple two-folder layout (no workspace tooling). Shared types are duplicated minimally or kept in `server` and mirrored in `client` as needed.

## Language & tooling
- **TypeScript** everywhere (`strict: true`).
- **ESLint + Prettier** — committed configs; run before QA.
- Node 22, npm 10.
- Package manager: **npm** (no pnpm/yarn).

## Environment
- Each app has `.env` (gitignored) + `.env.example` (committed, no secrets).
- Server env: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `PORT`, `CLIENT_ORIGIN`.
- Client env: `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`.
- Local Postgres: Docker (`docker run`) or local `psql` (v14 present). Documented in server README during M2.

## Conventions
- REST API under `/api/v1/*`. JSON request/response. Errors: `{ error: { code, message } }`.
- Auth: JWT access (short-lived) + refresh token. RBAC middleware enforces roles.
- Validation at the boundary (e.g. Zod) before hitting services.
- Services/controllers/routes separation on the server; feature-folder structure on the client.
- No new significant dependency without approval (CLAUDE.md rule 1).
- Follow existing patterns; avoid unnecessary refactoring.

## Pre-handoff checks (developer runs before QA)
- `npm run lint` and `npm run typecheck` pass in each touched app.
- App builds and starts.
