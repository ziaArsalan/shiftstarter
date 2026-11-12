# Plan — M2: Core Platform & User Roles

Status: **awaiting approval.** Conforms to docs/ARCHITECTURE.md §4 (RBAC), §6 (API), DEVELOPMENT.md conventions, ADR-004.

## 1. Goal and scope
Deliver the identity and profile foundation: JWT auth (access + refresh), RBAC, registration/login, worker profile, pharmacy profile + locations, credential upload, admin shell, and a responsive client shell. All under `/api/v1`.

**In scope:** Auth, workers profile + credentials, pharmacies profile + locations, a minimal admin API (users list, credential queue and approve/reject), client shell, admin shell.
**Out of scope (later milestones):** Availability endpoints (M3, availability and matching), shifts, applications, bookings, messaging, payments, email verification and password reset (not in M2 scope; see Decisions), notifications.

Already in place: scaffold, Postgres on 5433 with all 16 tables migrated, `server/.env`. `/health` exists and must keep working.

## 2. Build order
1. **Phase A – Server foundation:** config/env validation, error handling, Prisma singleton, `/api/v1` router, Zod validate middleware.
2. **Phase B – Auth:** register, login, refresh (rotation), logout, me; `requireAuth` and `requireRole`.
3. **Phase C – Profiles:** worker profile, pharmacy profile, locations CRUD with ownership checks.
4. **Phase D – Credentials:** storage adapter, upload/list/delete, authenticated download, admin approve/reject.
5. **Phase E – Client shell and auth:** routing, API client, AuthContext, protected routes, login/register.
6. **Phase F – Client role pages:** worker and pharmacy dashboards/profile/credentials/locations, admin shell.
7. **Phase G – Hardening:** admin seed script, lint/typecheck/build, README server setup notes, `.env.example` updates.

## 3. Server changes (`server/src/`)
Layout (routes -> controllers -> services, per conventions):
```
config/env.ts            Zod-parsed env (fail fast)
lib/prisma.ts            PrismaClient singleton
lib/errors.ts            AppError(code,status,message); errorHandler -> { error:{code,message} }
lib/tokens.ts            sign/verify access JWT; generate/hash refresh token
lib/storage/             StorageProvider interface + local-disk impl (+ S3 impl if approved)
middleware/auth.ts       requireAuth (verify Bearer access JWT -> req.user {id, role})
middleware/rbac.ts       requireRole(...roles)
middleware/validate.ts   validate({body,query,params}) with Zod
middleware/upload.ts     multer config (size/mime limits)
modules/auth/            auth.routes|controller|service|schemas
modules/workers/         profile + credentials
modules/pharmacies/      profile + locations
modules/admin/           users, credentials review
routes/index.ts          mounts /api/v1; app.ts wires it, json error handler, cookie-parser, helmet, rate limit
prisma/seed.ts           creates an initial ADMIN from env (ADMIN_EMAIL/ADMIN_PASSWORD)
```

### Endpoints (all `/api/v1`)
| Endpoint | Access | Notes |
|---|---|---|
| `POST /auth/register` | public | body: email, password, role in {WORKER, PHARMACY} (ADMIN never self-registers); worker also firstName/lastName, pharmacy businessName. Creates User + empty-ish profile in one transaction. Returns user + access token; sets refresh cookie. 409 on duplicate email. |
| `POST /auth/login` | public | Generic "Invalid email or password" error; rejects SUSPENDED users (403). Rate-limited. |
| `POST /auth/refresh` | refresh token | Rotation: revoke presented token, issue new pair. Reuse of a revoked token revokes all that user's tokens (theft detection). |
| `POST /auth/logout` | refresh token | Sets `revokedAt`, clears cookie. |
| `GET /auth/me` | any authed | User + role + profile summary. |
| `GET/PUT /workers/me/profile` | WORKER (ADMIN per matrix via later admin tools) | Fields from WorkerProfile. |
| `GET/POST /workers/me/credentials`, `DELETE /workers/me/credentials/:id` | WORKER | multipart upload (field `file`, plus type, issuedAt?, expiresAt?). Delete only if owned; removes stored file. Re-upload after reject allowed. |
| `GET /workers/me/credentials/:id/file` | owner or ADMIN | Streams the file after an auth check (no public URLs). Small addition beyond §6 needed so documents are viewable. |
| `GET/PUT /pharmacies/me/profile` | PHARMACY | |
| `GET/POST/PUT/DELETE /pharmacies/me/locations(/:id)` | PHARMACY | Ownership enforced in the service; delete blocked later if location has shifts (M3). |
| `GET /admin/users`, `PATCH /admin/users/:id` | ADMIN | list with role/status filter + pagination; PATCH status (ACTIVE/SUSPENDED). Admin cannot suspend self. |
| `GET /admin/credentials?status=` , `PATCH /admin/credentials/:id` | ADMIN | approve/reject with notes; sets reviewedBy/reviewedAt. |
| `GET /admin/reports` | deferred | stub not built in M2. |

`GET /workers/me/availability` etc. are deferred to M3.

### Security details
- Password: min 8 chars, hashed (see Decision 2).
- Access JWT: 15 min, claims `sub`, `role`. Refresh: 256-bit random opaque token, 7-30 days, only SHA-256 hash stored in `RefreshToken.tokenHash` (already unique).
- Zod at every boundary; helmet; CORS restricted to `CLIENT_ORIGIN` with `credentials: true`; rate limit on auth routes; normalise email to lowercase.
- Uploads: allowed mime pdf/jpeg/png (verify magic bytes, not just header), max 10 MB, random storage key, original filename sanitised.

## 4. Database changes
Initial migration already covers all tables. Proposed **one small additive migration** `m2_credential_file_meta`:
- `Credential`: add `fileName String`, `mimeType String`, `sizeBytes Int`; `fileUrl` is used as the storage key (documented, no rename to avoid churn).
- No destructive changes. Run `prisma migrate dev`.
- Seed script is idempotent for the admin user.

## 5. API changes
New under `/api/v1` as listed; errors always `{ error: { code, message } }` (codes e.g. VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT). Validation errors include field details. `/health` unchanged.

## 6. Client changes (`client/src/`)
New deps and structure (feature folders):
```
app/router.tsx           react-router; layouts
app/providers.tsx        QueryClient + AuthProvider
lib/api.ts               fetch wrapper: base VITE_API_URL, attaches access token, on 401 tries one refresh then retries, else logs out
features/auth/           AuthContext (user, role, login, register, logout, bootstrap via refresh -> /auth/me), RequireAuth, RequireRole, LoginPage, RegisterPage (role picker)
features/worker/         WorkerDashboard, ProfilePage, CredentialsPage (upload, list, status badge, delete)
features/pharmacy/       PharmacyDashboard, BusinessProfilePage, LocationsPage (add/edit/delete)
features/admin/          AdminLayout (sidebar), AdminDashboard (stat tiles placeholder), UsersPage (list + suspend), CredentialQueuePage (approve/reject)
components/              Button, Input, Card, Badge, Spinner, FormField, Toast, AppShell (header with logo, role nav, mobile hamburger)
pages/                   Landing, NotFound, Forbidden
```
- Routes: `/` landing, `/login`, `/register`, `/worker/*`, `/pharmacy/*`, `/admin/*`; post-login redirect by role; unauthenticated -> `/login`; wrong role -> `/forbidden`.
- UI follows `docs/BRAND.md` via `brand.*` tailwind tokens: navy headings, `brand-blue` primary buttons, `surface-muted` cards, azure accents only for large elements; logo from `/shiftstarter-logo.png`. Mobile-first responsive (works at 375px and desktop); form labels, focus rings and AA contrast.
- Env: `VITE_API_URL=http://localhost:4000/api/v1`.
- Server-side forms use client-side validation mirroring server rules (react-hook-form + zod).

## 7. New dependencies (approve in one go)
**Server:** `jsonwebtoken`, `zod`, `cookie-parser`, `helmet`, `express-rate-limit`, `multer`, hashing lib per Decision 2 (`argon2` or `bcryptjs`), `file-type` (magic-byte check); dev: `@types/jsonwebtoken`, `@types/cookie-parser`, `@types/multer`. If S3 chosen: `@aws-sdk/client-s3` (+ presigner optional).
**Client:** `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`. (HTTP via native fetch, no axios.)
No test framework added in M2 (QA is Playwright-driven by the qa-tester).

## 8. Decisions requiring approval
1. **Credential-document storage provider (open decision from DECISIONS.md).**
   - A: Local disk behind a `StorageProvider` interface for dev/staging now; swap to S3-compatible in M5 deploy. Pros: zero cost/setup, unblocks M2. Cons: not durable on ephemeral hosts; must switch before production.
   - B: S3-compatible from day one (AWS S3, Cloudflare R2, or MinIO locally in Docker). Pros: production-ready, private buckets with signed URLs. Cons: needs an account/keys now and client-borne cost.
   - **Recommend A with the adapter interface, using R2/S3 in M5** (the interface keeps files private, served only via the authenticated endpoint). Record outcome as ADR-007.
2. **Password hashing.** `argon2` (recommended, modern, memory-hard; native build, prebuilt binaries available) vs `bcryptjs` (pure JS, simpler deploys, slower, 72-byte limit). Recommend **argon2** (argon2id).
3. **Client token storage.** (a) Access token in memory + refresh token in httpOnly, SameSite=Lax, Secure-in-prod cookie (recommended: XSS cannot read refresh token; session survives reload via `/auth/refresh`). (b) Both in localStorage (simple, but XSS-exposed). (c) Both as httpOnly cookies (needs CSRF protection; weaker for the future mobile app). Recommend **(a)**. Mobile later can use the same endpoints by also accepting refresh token in the body (support both: cookie preferred, body fallback).
4. **Admin account creation.** No public admin registration. Recommend the seed script reading `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` (not committed).
5. **Email verification and password reset** are not in M2 scope; they need an email provider (open decision for M4). Recommend deferring; users register as ACTIVE with `emailVerified=false`. Confirm that is acceptable.
6. **Admin API breadth.** Plan includes the credential approve/reject and user suspend APIs now (small, makes the admin shell useful and enables the verification flow). Confirm, or restrict M2 to a read-only shell.
7. **Credential migration** (adds fileName, mimeType, sizeBytes) as described in section 4.
8. **Worker registration collects only name + email + password**; the rest is edited on the profile page. Confirm.

## 9. Testing strategy
Pre-handoff (developer): `npm run lint`, `npm run typecheck`, `npm run build` in both apps; `npx prisma validate`; migration applied; seed admin works.

### Acceptance criteria
**Preconditions (M1 scaffold sanity, from qa/MILESTONE-1.md):**
- [ ] `npx prisma validate` passes; `npm run typecheck` and `npm run build` pass for both apps.
- [ ] `GET http://localhost:4000/health` returns `{ status: "ok" }`.
- [ ] Client renders at http://localhost:5173 (now the landing page with brand styling).
- Postgres container `pharmacy-postgres` running on 5433; admin seeded.

**Auth**
- [ ] Register as worker (name, email, password) -> lands on worker dashboard; same for pharmacy -> pharmacy dashboard.
- [ ] Duplicate email shows an inline error; weak password / invalid email shows field errors.
- [ ] Login with valid credentials lands on the role dashboard; invalid password shows a generic "Invalid email or password" and no redirect.
- [ ] Reload the page while logged in -> still signed in (refresh cookie). Logout -> redirected to login; browser back/forward does not show protected pages; refresh no longer works.
- [ ] Suspended user cannot log in.
- [ ] Refresh rotation: old refresh token rejected after use (API check).

**RBAC**
- [ ] Unauthenticated visit to `/worker`, `/pharmacy`, `/admin` -> redirect to `/login`.
- [ ] Worker visiting `/admin` or `/pharmacy` -> Forbidden page; pharmacy visiting `/worker` or `/admin` -> Forbidden.
- [ ] API: worker token calling `/admin/users` or `/pharmacies/me/profile` returns 403 with `{error:{code,message}}`; no token returns 401.
- [ ] Registering with `role: ADMIN` via API is rejected.

**Worker**
- [ ] Edit profile (title, license, experience, rate, address) -> save -> reload shows persisted values; invalid values (negative experience) rejected.
- [ ] Upload a PDF credential with type -> appears with status PENDING; viewing/downloading works for owner; delete removes it.
- [ ] Upload a .exe or a file over 10 MB is rejected with a clear message; a renamed non-PDF file with a pdf extension is rejected.
- [ ] Worker cannot view another worker's credential file (API 403/404).

**Pharmacy**
- [ ] Edit business profile and persist.
- [ ] Add, edit, delete a location; list updates; one pharmacy cannot access another's location ids (404).

**Admin**
- [ ] Seeded admin logs in -> admin dashboard shell with sidebar nav (Users, Credentials).
- [ ] Users page lists registered users, filter by role, suspend/reactivate a user.
- [ ] Credential queue shows the worker's PENDING credential; approve and reject (with note) updates status, and the worker's credentials page reflects it.

**Responsive/brand**
- [ ] At 375px width: nav collapses to a menu, forms usable, no horizontal scroll; at 1280px full layout.
- [ ] Brand navy/blue palette and logo visible; keyboard focus visible on form controls.

### Notes for QA
- Drive Playwright interactively (ADR-006); use unique emails per run (`qa+<timestamp>@example.com`).
- Admin creds come from local `server/.env` seed values (ask the developer; do not commit).
- Uploaded files land in `server/uploads/` (gitignored); clean between runs if needed.
- Use `curl` for the API-only checks (403/401, refresh reuse, ADMIN role registration).
- Ports: client 5173, server 4000, DB 5433.

## 10. Risks and dependencies
- Depends on M1 (done) and local Postgres container running; `server/.env` must exist (tool cannot write it; created by hand) and gain new vars (`JWT_ACCESS_EXPIRES`, `REFRESH_TTL_DAYS`, `UPLOAD_DIR`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). `.env.example` updated.
- Cross-origin cookies: client (5173) and server (4000) are different origins; requires `credentials: true` on CORS and fetch, SameSite=Lax works on localhost (same site). In production use same-site subdomains (e.g. app. and api. on shiftstarter.ca) -- flag for M5.
- Local-disk storage is not durable; must switch before production (tracked in M5).
- Credential documents are sensitive (PII): private access only, no public URLs, no logging of contents.
- `argon2` native build can fail on some deploy targets (fallback bcryptjs).
- Scope creep risk: admin APIs and availability; availability explicitly deferred to M3.
- Staff-facing legal items (privacy policy/consent for ID documents) not addressed; flag to client.
