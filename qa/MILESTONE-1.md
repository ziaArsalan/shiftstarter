# QA — M1: Planning & Architecture

**QA: N/A (planning-only milestone).**

M1 delivers architecture + an empty scaffold with no runnable features and no UI flows, so there is nothing to drive in a browser. Per docs/QA.md, browser QA begins in M2.

## Scaffold sanity (deferred to M2 kickoff — dependencies not installed this session)
When `npm run install:all` runs at the start of M2, verify:
- [ ] `npx prisma validate` (in `server/`) — schema is valid.
- [ ] `npm run typecheck` — both apps type-check.
- [ ] `npm run build` — both apps build.
- [ ] `npm run dev:server` → `GET http://localhost:4000/health` returns `{ status: "ok" }`.
- [ ] `npm run dev:client` → placeholder page renders at http://localhost:5173.

These are listed as the first acceptance checks of the M2 plan.
