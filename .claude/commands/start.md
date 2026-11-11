---
description: Run a milestone through the full pipeline — plan, approve, develop, QA, bugfix, changelog, commit, push. Usage: /start [M<n>] [--skip-qa]
---

You are the **orchestrator** of the milestone workflow. The user invoked `/start` with: `$ARGUMENTS`.

The full pipeline is in [docs/WORKFLOW.md](../../docs/WORKFLOW.md). Follow it exactly. Delegate to the agents in [docs/AGENTS.md](../../docs/AGENTS.md) and keep each agent's context minimal — never dump the whole docs system into a subagent.

## Step 0 — Parse args & select the milestone
Arguments may contain:
- A milestone ID (`M2`, `m2`, `2`) → run that milestone.
- `--skip-qa` (or `skip-qa` / `--no-qa`) → skip the QA phase; record `QA: SKIPPED BY USER COMMAND`.
- Empty → auto-select.

Actions:
1. Read [MILESTONES.md](../../MILESTONES.md).
2. Resolve the milestone:
   - ID given and not `done` → use it (if `in_progress`, ask: resume or pick another).
   - No ID → apply the selection rules: among milestones whose **dependencies are all `done`**, pick highest priority (P0→P3) then lowest number. If none eligible, report and stop.
3. Announce the chosen milestone and whether `--skip-qa` is active.

## Step 1 — Plan
- Invoke **planner** (or **architect** for architecture-heavy milestones) with only: the milestone entry + architecture refs. It writes `plans/MILESTONE-N.md` and posts the `PLAN READY` summary.

## Step 2 — Approval gate (`approval_required: true`)
- Present the plan summary and **wait**. Do not proceed without approval. (This gate is intentionally explicit so it can later be set `approval_required: false`.)

## Step 3 — Develop
- Mark the milestone `in_progress`.
- Invoke **developer** with only: the approved plan + architecture/development docs. It implements, runs lint/typecheck/build.

## Step 4 — QA (skip if `--skip-qa`)
- Invoke **qa-tester** with only: plan acceptance criteria + the running app. Playwright interactive-driving.
- If skipped: write `QA: SKIPPED BY USER COMMAND` to `qa/MILESTONE-N.md`.

## Step 5 — Bugs (only if QA found some)
- Present the numbered bug report and **wait for approval to fix** (`approval_required: true`).
- After approval: **bug-fixer** patches → **qa-tester** retests. Loop until PASS (recovery limit per WORKFLOW.md). Do not mark done until QA passes.

## Step 6 — Publish
- Invoke **git-publisher**: update CHANGELOG → mark milestone `done` in MILESTONES.md → commit (Conventional Commits) → push. It verifies no secrets and stops if `gh` is unauthenticated.

## Throughout
- Honor `STOP` / `pause` / `resume` / `retry` / `skip` / `abort`.
- Ask before any safety-sensitive action (see CLAUDE.md rule 3 and GIT.md Safety).
- For significant mid-flight plan changes, stop and ask (WORKFLOW.md).
