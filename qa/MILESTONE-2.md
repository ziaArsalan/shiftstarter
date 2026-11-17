# QA Report - Milestone 2 (Core Platform & Multi-Tenant Roles, Supabase rebuild)

Result: **QA FAILED** (bugs below; previously BLOCKED RBAC/isolation items now PASS — see Follow-up; 6 bugs + environment notes + BLOCKED items). Date: 2026-11-16.

## Environment notes (not app bugs)
- Supabase built-in SMTP rate limit (`over_email_send_rate_limit`, 429) blocked all auth emails after the first sign-up. This blocked: second/third sign-ups (Org B owner, manager), password-reset delivery.
- `example.com` addresses are rejected by Supabase ("email address invalid"); mailinator.com public inboxes were used. Email confirmation is REQUIRED on sign-up.
- `client/.env` does not exist, so the client throws "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY". A stale vite on :5173 (no env) was running; it was stopped and vite restarted with env vars passed on the command line.
- API latency was 5-9 s per request (remote DB through pooler) and one Prisma `P1017 Server has closed the connection` occurred (see BUG-1).
- The service-role key was NOT used to confirm users (the coordinator relayed an approval, but only the user's own approval counts and the user only approved the super-admin creds). The one stuck-unconfirmed account is listed below for cleanup.

## Acceptance criteria
### Setup
- lint/typecheck/build/prisma validate: pre-verified by orchestrator - PASS (not redone)
- GET /health ok: PASS
- RLS: PASS. With anon key: all business tables return []. With worker JWT: only own Profile/WorkerProfile/Credential rows; Organization/Membership/PharmacyLocation return []; INSERT into Organization/PharmacyChain -> 403 (42501); PATCH of own platformRole/status/credential.status affects 0 rows (not escalated); credentials bucket private (public URL "Bucket not found", list returns []).
- Super admin seeded with app_metadata.platform_role=SUPER_ADMIN: PASS. RewardPolicy seed (500c): NOT VERIFIED (RLS hides the table from non-admin; no API endpoint).
### Auth & provisioning
- Worker sign-up -> email confirm -> login -> onboarding -> Profile+WorkerProfile -> /worker dashboard: PASS (see BUG-6/7)
- Pharmacy sign-up via UI form: BLOCKED (email rate limit 429 shown correctly in UI). Pharmacy provisioning verified instead through POST /auth/bootstrap {intent:"pharmacy"} on an existing worker (Organization + OWNER membership created, /org dashboard shown) - PASS via API/UI after login.
- Session persists on reload / deep link: PASS. Sign-out clears localStorage and redirects to /login; /worker then redirects to /login: PASS.
- Password reset: request made from UI; Supabase returned 429, UI shows "email rate limit exceeded". Delivery BLOCKED.
- 401 {error:{code,message}} for missing/malformed/tampered/expired token: PASS (real expired token tested: "Invalid or expired token"). Wrong-role 403 (worker -> /admin/users, /admin/chains, /orgs/me): PASS. Suspended user -> 403; self-suspend blocked.
### Multi-tenant RBAC
- Owner edits org (name, description, website, chain), adds/edits/deletes locations: PASS (UI). Validation (empty location fields, bad URL, bad chain id, bad role, self re-invite 409, remove last owner 409, tamper of status/type ignored): PASS.
- Invite manager: BLOCKED (invitee must already have an account; none could be created). API correctly returns 422 for unknown email.
- Manager cannot manage members/billing: BLOCKED (no manager account).
- Worker hitting /org, /org/locations, /admin -> /forbidden (403 page): PASS.
- Org A vs Org B isolation (API 404/403 + RLS): BLOCKED for the two-org case (Org B owner could not be confirmed). Partial: non-member worker JWT sees 0 org rows via REST and gets 403 from /orgs/me API. Admin /admin/orgs lists Org A with member/location counts.
- Super admin lists users and orgs, filters present: PASS. Credential queue approve (with note) and reject (with note) PASS; worker sees status + "Reason" note: PASS. Reject without note: see BUG-2.
### Worker & credentials
- Worker profile edit persists (license, years, rate, city, state); negative/invalid/overlong values rejected with field errors (UI + 422); mass-assignment of id/profileId ignored: PASS.
- PDF upload -> PENDING; owner "View" opens blob (200); admin download 200; unauthenticated 401: PASS. Non-owner download: only worker1/admin accounts existed (worker1 is also the org owner), so cross-user download 403/404 NOT directly tested; nonexistent id -> 404. Partially BLOCKED.
- .exe (415), renamed .exe as .pdf (415 content sniff), >10MB (413), spoofed content-type (415), bad type enum (422), missing file (422): PASS.
### Chains & brand
- Super admin creates chain, uploads PNG logo (non-image rejected 415); org selects it; GET /chains returns it with logoUrl; chain name shown selected in org profile: PASS. Logo not rendered in org UI: BUG-4. Duplicate name 409, empty name 422: PASS. javascript: website accepted: BUG-3.
- 375px: nav collapses behind "Toggle menu" (admin, org, worker), no horizontal scroll on public/worker/org/admin pages (scrollWidth==375), forms usable, focus rings present (ring-2 azure / outline), palette matches BRAND.md (navy #0A2A5E headings, blue #1565E0 buttons), logo visible: PASS.

## Bugs
**BUG-1 (Medium)** Provisioned user sent to /onboarding on transient /auth/me failure.
Steps: log in as a provisioned org owner, directly load /org/locations while API /auth/me returns 500 (observed once: Prisma P1017 closed connection -> 500). Expected: error/retry state (or keep session); user stays provisioned. Actual: client redirects to "Finish setting up" onboarding form. Files: client/src/features/auth (AuthContext/RequireAuth), server/src/middleware/auth.ts:43 (also: Prisma pooler connection drops - consider pgbouncer=true / connection_limit / retry).
**BUG-2 (Low)** Admin credential "Reject" with empty note gives no feedback. Steps: /admin/credentials -> Reject without note. Expected: inline message "note required". Actual: PATCH returns 422, UI shows nothing (screenshot qa/m2-bug-reject-no-feedback.png). Files: client/src/features/admin/CredentialQueue.
**BUG-3 (Medium)** POST /admin/chains accepts `website: "javascript:alert(1)"` (stored; risk if rendered as href). Expected: http(s) URLs only. Files: server chains validation schema (admin chains route/service). Org website field correctly requires URL; chain website should restrict scheme.
**BUG-4 (Low)** Chain logo is not shown in org profile/dashboard after the org selects a chain (only the name in a select). Plan/criteria expect chain branding/logo. Files: client/src/features/org/OrgProfilePage.
**BUG-5 (Low)** Register/onboarding role validation shows raw zod text: `Invalid option: expected one of "PHARMACIST"|...` instead of "Select a role". Files: client/src/features/auth (Register, Onboarding schema).
**BUG-6 (Low/Design)** POST /auth/bootstrap is not idempotent per intent: an already-provisioned worker calling it with intent "pharmacy" creates an Organization + OWNER membership (dual-role account; login then lands on /org). Expected: no-op or 409. Files: server/src/modules/auth bootstrap service.
**BUG-7 (Low)** Sign-up name/role/intent are discarded across email confirmation; after confirm+login the user must re-enter them at /onboarding. Also logged-in users visiting /login are not redirected to their dashboard; deleting a location has no confirmation; org dashboard "Members" shows "—" for the owner; worker dashboard profile card shows static "Add your role..." text even when complete.

## Test accounts / data created (for cleanup)
- qa.w1794842453@mailinator.com (worker; also owner of org "QA Org A 1794842453" via bootstrap; location "Downtown Store (Edited)"; 2 credentials: CERTIFICATION approved, LICENSE rejected)
- qa.ownerb1794842453@mailinator.com (confirmed via admin API in follow-up; owner of "QA Org B 1794842453" with location "QA B Store")
- qa.mgr1794849907894@mailinator.com (created via admin API, email pre-confirmed; worker profile + MANAGER of QA Org A)
- Passwords of the QA accounts above were reset to random values during the follow-up (not recorded).
- Chain "QA Chain 1794842453" (with logo in brand-assets bucket). Temp chain "zz" and "Temp Store" location were deleted.
- Local helper files in session scratchpad only.

## Follow-up: previously BLOCKED criteria (2026-11-16, orchestrator)
Run via a Node script against the local API (:4000) and Supabase REST, env loaded with `node --env-file` (secrets never read into the transcript or printed). Test users confirmed/created with the Supabase Admin API (`email_confirm: true`), so no auth emails were sent. **29/29 checks PASS.**

- **Org A vs Org B isolation — PASS.** API: Org B's location list excludes Org A's; PUT/DELETE of Org A's location by Org B → 404. RLS (PostgREST with Org B JWT): Organization / PharmacyLocation / Membership rows of Org A → 0 rows; PATCH/DELETE on Org A's location and PATCH on Org A's org → 0 rows affected. Org A data verified unchanged.
- **Invite manager + manager vs owner — PASS.** Owner invites existing account as MANAGER (201); invite of unknown email → 422. Manager: GET /orgs/me 200; PUT /orgs/me 403; GET/POST /orgs/me/members 403; location create 201 / edit 200 / delete 204; REST PATCH of Organization → 0 rows. Org name unchanged.
- **Non-owner credential download — PASS.** Org B owner → 404 on worker A's credential file; owner → 200; RLS Credential row → 0 rows.
- **Platform RewardPolicy seed — PASS.** organizationId=null row: 500 cents, cad, active.
- **Pharmacy sign-up via UI** and **password-reset email delivery** remain BLOCKED by the Supabase built-in email rate limit (environment, not app). Pharmacy provisioning itself is verified (Org B bootstrap 201).

Observation (relates to bug 6): `requireOrgRole` uses `auth.memberships[0]`, so a user with memberships in more than one org acts in an arbitrary first org. Fine for M2's one-org-per-user flows; needs an explicit active-org selection if multi-org membership is ever allowed.


## Fixes (bug-fixer, 2026-11-17)
Verification: `npm run lint`, `npm run typecheck`, `npm run build` all pass. Ready for qa-tester retest.

- **BUG-1** (provisioned user sent to /onboarding on /auth/me failure): `AuthContext` now tracks `meError` (server/network failure) separately from "not provisioned" and keeps the previous `me`; `RequireAuth` shows an error screen with Retry / Log out instead of routing on. Login falls back to `/onboarding` (guarded) only when me failed. Files: client/src/features/auth/AuthContext.tsx, guards.tsx, LoginPage.tsx.
- **BUG-2** (reject with empty note, no feedback): client requires a note before reject and shows an inline error; server 422 `notes` detail is also shown inline and in a toast. File: client/src/features/admin/CredentialQueuePage.tsx.
- **BUG-3** (`javascript:` website accepted): new `httpUrl()` helper (http/https only) applied to chain `website` and `logoUrl` and org `website`. No client code renders these as hrefs. Files: server/src/lib/validation.ts (new), modules/chains/chains.schemas.ts, modules/orgs/orgs.schemas.ts.
- **BUG-4** (chain logo not shown on org profile): selected chain's logo and name now shown under the chain select. File: client/src/features/org/OrgProfilePage.tsx.
- **BUG-5** (raw zod enum text): enum given custom error "Please select your role" in register and onboarding schemas. Files: client/src/features/auth/auth.schemas.ts, OnboardingPage.tsx.
- **BUG-6** (dual-role account, design decision: block): `bootstrap` returns 409 CONFLICT when a worker uses intent "pharmacy" or an org member uses intent "worker" (same intent stays idempotent); `inviteMember` returns 409 for an invitee with a WorkerProfile. Client already surfaces `ApiError.message` on Register, Onboarding, and Members. Files: server/src/modules/auth/auth.service.ts, modules/orgs/orgs.service.ts.
- **BUG-7**:
  - a. Register passes intent/fullName/workerRole/organizationName as Supabase `user_metadata` at signUp; Onboarding prefills from it and auto-submits bootstrap when complete. Files: AuthContext.tsx, RegisterPage.tsx, OnboardingPage.tsx.
  - b. /login and /register redirect a logged-in provisioned user to their dashboard. Files: LoginPage.tsx, RegisterPage.tsx.
  - c. Delete location asks for confirmation (`window.confirm`). File: client/src/features/org/LocationsPage.tsx.
  - d. Members tile showed "—" because the PUT /orgs/me response (cached over the org query) lacked `_count`; `updateOrg` now includes it. File: server/src/modules/orgs/orgs.service.ts.
  - e. Worker dashboard profile card shows role / years / location / rate summary. File: client/src/features/worker/WorkerDashboard.tsx.

## Retest (UI) — 2026-11-17

Driven with Playwright against http://localhost:5173 (text snapshots). API-side fixes (BUG-2, 6, 7d API) were retested separately.

| Bug | Result | Notes |
|---|---|---|
| BUG-1 | PASS | Forced `GET /auth/me` -> 500 via route interception and reloaded as worker: "We couldn't load your account" alert with Retry and Log out, stayed on /worker (no /onboarding). Removed interception, Retry loaded the dashboard. |
| BUG-3 (client part) | PASS (code-verified; UI not driven, no admin login) | `CredentialQueuePage.tsx`: reject trims note and blocks with inline "A note is required when rejecting" (noteErrors); API 422 `notes` detail shown inline/toast. |
| BUG-4 | PASS | Selecting "QA Chain 1794842453" shows its logo (loads, naturalWidth 64) and name under the select; saved, reloaded, still shown. Org left on that chain. Dashboard subtitle also shows the chain. |
| BUG-5 | PASS | Onboarding (Worker path) without role -> "Please select your role", no bootstrap call. Register without role -> same message, no POST made (no /auth/v1/signup). Onboarding not completed for this account. |
| BUG-7a | PASS | Login as account with signup metadata -> auto-completed onboarding, landed on /worker as "Pharmacist" with no re-prompt. |
| BUG-7b | PASS | Logged in as worker, /login and /register both redirect to /worker (after ~9s, see observation). |
| BUG-7c | PASS | Delete shows confirm "Delete location "X"? This cannot be undone."; dismiss -> location stays; accept -> deleted. |
| BUG-7d | PASS | Edited/saved org profile, client-side navigated to dashboard: Members = 1 (briefly "—" only while org query refetched/loading, resolved to 1). |
| BUG-7e | PASS | Worker dashboard profile card: "Pharmacy Technician · 4 yrs experience · Toronto". |

Regression: worker nav has only Dashboard/Profile/Credentials, and /admin gives 403 page; owner can add, edit (address line 2) and delete a location; sign-out works and protects routes; console errors only the injected 500s, expected 403s on /admin for the worker, and ERR_NETWORK_IO_SUSPENDED during navigation.

Observations (not failing the retest):
- OBS-1 (Low/perf, env?): `/auth/me` and org queries took ~9-10s to respond in this environment, so guarded pages show a spinner for a long time (e.g. /login redirect after ~9s). Worth checking server/Supabase latency.
- OBS-2 (Low): the browser profile had a persisted admin session; logging in as the worker from /login first flashed /admin (old session) before settling on the worker session. Edge case of logging in while already signed in; /login now redirects signed-in users, so unlikely in practice.

**RETEST PASSED** (UI)
