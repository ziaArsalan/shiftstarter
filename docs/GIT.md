# Git Workflow

## Branching
- `main` — stable, deployable.
- Each milestone normally produces **one logical commit** on `main` (or a `milestone/MN` branch merged to main if the user prefers PRs — ask once).

## Commit convention (Conventional Commits)
```
feat: ...     a user-facing feature
fix: ...      a bug fix
refactor: ... non-behavioral change
chore: ...    tooling/scaffold/config
docs: ...     documentation only
test: ...     tests
```
Milestone commits summarize the milestone, e.g. `chore: scaffold architecture & tooling (M1)`.

## Per-milestone publish steps (git-publisher)
1. `git status` + `git diff` — review what's staged.
2. Confirm **no secrets / env / keys** are included (see Safety).
3. Update `CHANGELOG.md`.
4. Mark the milestone `done` in `MILESTONES.md`.
5. Commit with a conventional message.
6. Push to `origin main`.

## GitHub
- Remote: new **private** repo (created via `gh repo create`). Confirm the name with the user before creating.
- `gh` must be authenticated (`gh auth login`) before any push. If it isn't, **stop and ask** — do not attempt workarounds.

## Safety — never do without explicit approval
- Force push (`--force`) or rewriting shared history.
- Committing `.env`, `.env.*` (except `.env.example`), private keys, tokens, certs, credentials.
- Deleting significant data or functionality.
- Major API-breaking changes.

If any of these is required, stop and ask first.
