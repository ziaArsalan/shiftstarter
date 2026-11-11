# Workflow — Milestone Pipeline

Work runs in **batch/milestone mode**. The `/start` command orchestrates one milestone through the pipeline below. The orchestrator delegates to subagents ([docs/AGENTS.md](AGENTS.md)) and keeps each agent's context minimal.

## Pipeline

```
SELECT MILESTONE
      ↓
UNDERSTAND MILESTONE        (read MILESTONES.md entry + referenced docs)
      ↓
PLAN                        → plans/MILESTONE-N.md            [planner / architect]
      ↓
ASK APPROVAL  ← gate: approval_required: true
      ↓
DEVELOP                     (implement approved plan)          [developer]
      ↓
QA                          (Playwright interactive)           [qa-tester]        ── skipped if --skip-qa
      ↓
BUG REPORT  → qa/MILESTONE-N.md   (if bugs)
      ↓
ASK APPROVAL TO FIX  ← gate: approval_required: true           ── only if bugs found
      ↓
FIX → RETEST → QA           (loop until pass; see Recovery limits) [bug-fixer → qa-tester]
      ↓
CHANGELOG                   (update CHANGELOG.md)              [git-publisher]
      ↓
COMMIT → PUSH               (per GIT.md)                        [git-publisher]
      ↓
MARK MILESTONE done         (MILESTONES.md)
```

## Approval gates

Two gates are `approval_required: true`:
1. **After PLAN** — before any development.
2. **After BUG REPORT** — before fixing QA-found bugs.

Gates are explicit stages so they can later be set `approval_required: false` as project memory matures — without redesigning the pipeline. **Do not remove them now.**

### Plan approval format

```
PLAN READY
Milestone: M2 — Core Platform & User Roles
Summary: ...
Changes: ...
Risks: ...
Decisions requiring approval: ...
Waiting for approval.
```

Routine implementation choices already covered by the approved plan/architecture do **not** need extra approval.

## Command arguments

- `/start` — auto-select next ready milestone (see MILESTONES.md selection rules).
- `/start M2` — run milestone M2.
- `/start M2 --skip-qa` — run M2 but skip the QA phase. Record `QA: SKIPPED BY USER COMMAND` in `qa/MILESTONE-2.md` and the changelog entry. Never skip QA silently.

## Mid-flight plan changes

If development reveals the approved plan needs a **significant** change (new dependency, schema change, architecture shift), **STOP and ask** before proceeding. Minor, in-scope adjustments proceed.

## Limited automatic recovery

For routine failures (obvious implementation mistakes, build breaks from the current change, transient command/tooling errors): retry up to **3 times**. If still failing, **stop and ask**.

Always ask (never auto-recover) for: architectural, database-destructive, security, infrastructure, or ambiguous failures.

## Human override

- `STOP` → halt at the next safe point; do not auto-continue.
- `pause` / `resume` / `retry` / `skip` / `abort` → honored. If ambiguous, ask.
