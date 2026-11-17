# Git Workflow

## Branching (decided 2026-11-17)
- `main` — stable, deployable. **Nothing is pushed or merged to `main` without the user's explicit permission, given for that specific push.** Approval to commit/push a milestone means push its branch — not `main`.
- Each milestone lives on its own branch named **`M<n>`** (e.g. `M2`, `M3`), created from the latest `main` when the milestone starts. All milestone commits go there.
- Publishing a milestone = push `M<n>` to origin. Merging `M<n>` into `main` is a separate step: the user merges it (e.g. via a GitHub PR), or explicitly tells Claude to merge and push `main`.

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
5. Commit with a conventional message **on the milestone branch `M<n>`** (never on `main`).
6. Push the branch: `git push -u origin M<n>`. **Do not push or merge to `main`** — report back and wait for the user's explicit permission.

## GitHub
- Remote: new **private** repo (created via `gh repo create`). Confirm the name with the user before creating.
- `gh` must be authenticated (`gh auth login`) before any push. If it isn't, **stop and ask** — do not attempt workarounds.

## Safety — never do without explicit approval
- Any push or merge to `main`.
- Force push (`--force`) or rewriting shared history.
- Committing `.env`, `.env.*` (except `.env.example`), private keys, tokens, certs, credentials.
- Deleting significant data or functionality.
- Major API-breaking changes.

If any of these is required, stop and ask first.
