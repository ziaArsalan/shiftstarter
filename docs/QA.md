# QA Process

QA is a **real** testing phase — not a code read. A feature is not "done" until it is exercised like a user would.

## Tooling
- **Browser automation: Playwright, interactive-driving.** The qa-tester drives the live app step-by-step; Playwright returns **text** accessibility snapshots (cheap on tokens). Capture screenshots **only on failure** or when explicitly asked.
- Playwright is installed locally when first needed (Milestone 2). Milestone 1 is planning-only — no browser QA runs.
- Run against the local dev servers: client `http://localhost:5173`, API `http://localhost:4000` (confirm ports in DEVELOPMENT.md).

## Cycle
1. Build/start the relevant app(s).
2. Run automated tests (unit/integration) if present.
3. Drive the new feature as a real user: navigate, enter data, click, submit.
4. Test validation + success + failure states.
5. Check relevant API/network behavior.
6. Test key edge cases.
7. Record the result.

## Results
- All pass → `QA PASSED` → continue to changelog + git.
- Bugs found → write a bug report to `qa/MILESTONE-N.md`, then:

```
QA FAILED
Bugs found:
1. ...
2. ...
Waiting for approval to fix.
```

Each bug: **ID · Description · Steps to reproduce · Expected · Actual · Severity · Files/components.**

Do **not** make significant changes before approval. After approval: fix → retest → QA. Loop until pass (respect the recovery limit in WORKFLOW.md). Do not mark the milestone done until QA passes.

## Skip
If `--skip-qa` was passed: do not run QA. Record `QA: SKIPPED BY USER COMMAND` in `qa/MILESTONE-N.md` and in the changelog entry.
