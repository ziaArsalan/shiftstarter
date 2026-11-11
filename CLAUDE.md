# Pharmacy Staffing Marketplace — Claude Entry Point

Web platform connecting pharmacists/workers with pharmacies & employers.
Stack: **React + Vite + Tailwind** (client) · **Node + Express** (server) · **PostgreSQL + Prisma** · **JWT + RBAC** · **Stripe**.

This file is the entry point only. **Do not duplicate content here — follow the references.**

## Core rules

1. **Ask before deciding what matters.** Before any architectural, DB, security, infra, dependency, or convention decision not already defined in the docs below — ask. If there are multiple valid options, present them, recommend one, wait for approval. Do **not** ask about trivial choices already covered by the architecture/plan/standards.
2. **Context discipline.** Load only what the current step needs (see [docs/AGENTS.md](docs/AGENTS.md)). Reference docs; never copy their contents between files.
3. **Safety.** Never commit secrets (`.env*`, keys, tokens, certs). Ask before destructive/irreversible actions. See [docs/GIT.md](docs/GIT.md) §Safety.
4. **STOP** halts the workflow at the next safe point. `pause` / `resume` / `retry` / `skip` / `abort` are honored.

## How to work

- **Work is milestone-based (batch mode)**, not granular tasks. The 5 milestones are in [MILESTONES.md](MILESTONES.md).
- Run a milestone with the `/start` command (see [.claude/commands/start.md](.claude/commands/start.md)):
  - `/start` — pick the next ready milestone
  - `/start M2` — run a specific milestone
  - `/start M2 --skip-qa` — run it, skipping QA (recorded in the worklog)

## References (read only what the task needs)

| Topic | File |
|---|---|
| Architecture, stack, data model, API, deploy | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Milestone pipeline (how /start runs) | [docs/WORKFLOW.md](docs/WORKFLOW.md) |
| Agents & model tiers | [docs/AGENTS.md](docs/AGENTS.md) |
| Coding standards & env setup | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| QA process | [docs/QA.md](docs/QA.md) |
| Git workflow & safety | [docs/GIT.md](docs/GIT.md) |
| Architecture decision records | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Milestones & status | [MILESTONES.md](MILESTONES.md) |
| Durable project memory (portable) | [memory.md](memory.md) |
| User-facing changelog | [CHANGELOG.md](CHANGELOG.md) |

## Project facts

- Source of truth for scope: `QUOTATION - Bobby Pharma APP (1).pdf` (5 milestones, $2,200, 6–8 weeks).
- Mobile app is **future** — backend stays API-driven so it can be reused. Do **not** build mobile now.
