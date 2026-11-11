# Agents & Model Tiers

Agents live in `.claude/agents/`. Model tiers follow the cost policy: **Opus where reasoning quality drives the outcome, Sonnet for mid work, Haiku for mechanical work.**

| Agent | Model | Job | Reads (and nothing else) |
|---|---|---|---|
| **architect** | `opus` | System/DB/API design; hard architectural decisions; owns M1 | milestone entry · ARCHITECTURE.md · relevant existing code |
| **developer** | `opus` | Implements the approved plan exactly | plans/MILESTONE-N.md · ARCHITECTURE.md · DEVELOPMENT.md · files it edits |
| **planner** | `sonnet` | Turns a milestone into a concrete plan file | milestone entry · ARCHITECTURE.md refs · repo tree |
| **qa-tester** | `sonnet` | Playwright interactive-driving; returns PASS or numbered bug list | plan acceptance criteria · running app · QA.md |
| **bug-fixer** | `sonnet` | Patches exactly the QA bugs; no refactors | bug list · referenced files · ARCHITECTURE.md |
| **git-publisher** | `haiku` | Changelog + commit + push | plan summary · git diff · GIT.md · CHANGELOG.md |

## Context discipline (strict)

- Do **not** auto-load the whole docs system into every agent.
- Prefer a reference (`Read docs/ARCHITECTURE.md`) over copying content.
- A backend-only milestone must not load client-only context, and vice versa.
- Each agent reads only the rows listed above for its task.

## When to use which agent

- **Planning a milestone** → planner (architect for M1 or anything architecture-heavy).
- **Significant architectural/DB/security decision mid-milestone** → escalate to architect, then ask the user.
- **Writing feature code** → developer.
- **Verifying it works** → qa-tester.
- **Fixing QA bugs** → bug-fixer.
- **Shipping** → git-publisher.

Do not force every milestone through every agent. Skip agents a milestone doesn't need.

## Changing models

To re-tier (e.g. cost tuning), edit the `model:` field in the agent's `.claude/agents/*.md` frontmatter. Record the reason in DECISIONS.md if it's a policy change.
