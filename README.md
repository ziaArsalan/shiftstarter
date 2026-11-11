# ShiftStarter — Pharmacy Staffing Marketplace

**ShiftStarter** ([shiftstarter.ca](https://shiftstarter.ca)) is a web platform connecting pharmacists/workers with pharmacies & employers. Workers find and apply for shifts; pharmacies post shifts, review applications, manage bookings, message workers, and handle payments.

Brand: [docs/BRAND.md](docs/BRAND.md).

## Stack
React + Vite + Tailwind (client) · Node + Express (server) · PostgreSQL + Prisma · JWT + RBAC · Stripe.

## Structure
```
client/   React web app        (dev: http://localhost:5173)
server/   Express API + Prisma  (dev: http://localhost:4000)
docs/     Architecture, workflow, standards
```

## Getting started (from M2 onward)
```bash
npm run install:all          # install client + server deps
cp server/.env.example server/.env   # fill in DATABASE_URL, secrets
cp client/.env.example client/.env
npm --prefix server run prisma:migrate   # create the DB schema
npm run dev:server           # terminal 1
npm run dev:client           # terminal 2
```

## Working with Claude Code
Milestone-based workflow. See [CLAUDE.md](CLAUDE.md). Run a milestone with `/start`, `/start M2`, or `/start M2 --skip-qa`.

## Status
**M1 — Planning & Architecture: complete.** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [server/prisma/schema.prisma](server/prisma/schema.prisma), and [MILESTONES.md](MILESTONES.md).
