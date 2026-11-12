# Plan — M2 (rebuild): Core Platform & Multi-Tenant Roles on Supabase

Status: **awaiting approval.** Supersedes the M2 v1 plan (custom JWT, 3-role, local Postgres). Conforms to the revised docs/ARCHITECTURE.md (§2 stack, §4 auth/tenancy/RBAC, §5 data model, §6 API, §9 storage) and DECISIONS.md ADR-008..ADR-012.

## 1. Goal and scope
Rebuild the identity + profile foundation on **Supabase** with the **multi-tenant SaaS** model: Supabase Auth, `Profile` provisioning, Organizations + Memberships (OWNER/MANAGER), worker profiles (4 worker roles), org locations, credential upload on Supabase Storage, a pharmacy-chain catalog, and a super-admin portal shell. All business logic under `/api/v1`; tenant isolation via RLS + service scoping.

**In scope:** Supabase Auth integration (client + server JWKS verify); Profile bootstrap; orgs + memberships; worker profiles; org locations; credentials on Supabase Storage; pharmacy-chain catalog (super-admin CRUD + selection); super-admin shell (users, orgs, credential queue, chains); client shell + role-aware routing; schema migrated to Supabase; RLS policies live.
**Out of scope (later):** availability + matching (M3), shifts/applications/bookings (M3), rewards earn/redeem + Blackhawk (M3b — schema only in M2), payments/messaging/notifications/reviews (M4). Rewards tables exist in the schema but no earn/redeem logic is wired in M2.

## 2. What survives the checkpoint vs. what is replaced

**Survives / adapts (from commit e1d825a):**
- Repo layout, TS/lint/format tooling, `/health`, env-validation pattern (`config/env.ts`), error handling (`lib/errors.ts`), Zod validate middleware, `routes/index.ts` mounting, Prisma singleton.
- The **`StorageProvider` interface** (`lib/storage/types.ts`) — kept as-is; local-disk impl replaced by a Supabase impl.
- Module shape (routes → controller → service → schemas) for workers/orgs/admin.
- Client shell structure (router, providers, feature folders, brand components, RequireAuth/RequireRole concept), re-pointed at Supabase.
- Credential `fileName/mimeType/sizeBytes` fields and upload validation (magic-byte, size/mime limits).

**Replaced / removed:**
- **Auth stack:** `lib/tokens.ts`, `RefreshToken` model, argon2 hashing, cookie-based refresh, `/auth/register|login|refresh|logout` — replaced by Supabase Auth + JWKS verify. `middleware/auth.ts` now verifies a Supabase token and loads `req.auth`.
- **Role model:** `Role` enum / `User` / `PharmacyProfile` → `Profile` + `Organization` + `Membership` + `WorkerRole`/`PlatformRole`/`OrgRole`.
- **DB host + migrations:** local Postgres (5433) → Supabase; existing migrations reset and regenerated against Supabase. The M2 v1 `m2_credential_file_meta` migration is absorbed into the new baseline.
- **Storage impl:** local disk → Supabase Storage.
- **Deps:** remove `jsonwebtoken`, `argon2`/`bcryptjs`, `cookie-parser`; add `@supabase/supabase-js`, `jose`.

## 3. Build order
1. **Phase A — Supabase + schema baseline:** point Prisma at Supabase (`DATABASE_URL` pooled + `DIRECT_URL`); reset migration history; `prisma migrate dev` to create the new baseline; author + apply RLS policy SQL (`server/supabase/policies/`); seed platform `RewardPolicy` (500 cents) and the super admin.
2. **Phase B — Auth (server):** JWKS verify middleware → `req.auth` {profile, memberships, workerProfile}; `GET /auth/me`; `POST /auth/bootstrap` (or DB trigger — see open decision) to create `Profile` + worker/org on first login; RBAC middleware (`requirePlatformRole`, `requireOrgRole`, `requireWorker`).
3. **Phase C — Orgs & memberships:** org profile CRUD (owner), member invite/remove (owner), locations CRUD (owner/manager) with tenant scoping.
4. **Phase D — Worker profiles:** profile CRUD (role/license/rate/location).
5. **Phase E — Credentials on Supabase Storage:** Supabase `StorageProvider` impl; upload/list/delete; authenticated download (stream or short-lived signed URL); super-admin approve/reject.
6. **Phase F — Pharmacy-chain catalog:** super-admin CRUD; `GET /chains` for selection; logo upload to `brand-assets`.
7. **Phase G — Client:** `supabase-js` client + session; AuthContext bootstrapping via Supabase session → `/auth/me`; register intent picker (worker vs pharmacy); role-aware routing; worker profile/credentials pages; org profile/members/locations pages; super-admin shell (users, orgs, credential queue, chains).
8. **Phase H — Hardening:** super-admin seed script (Supabase Admin API sets `app_metadata` claim + Profile), lint/typecheck/build, `.env.example` updates, README Supabase setup notes.

## 4. Server structure (`server/src/`)
```
config/env.ts            + SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWKS_URL, DATABASE_URL, DIRECT_URL
lib/prisma.ts            PrismaClient singleton (Supabase connection)
lib/supabase.ts          service-role client (admin auth + storage)
lib/jwks.ts              cached JWKS verifier (jose) for Supabase access tokens
lib/errors.ts            unchanged
lib/storage/             StorageProvider interface (kept) + supabase.ts impl (local.ts retained for tests)
middleware/auth.ts       verify Supabase JWT -> load Profile/memberships -> req.auth
middleware/rbac.ts       requirePlatformRole / requireOrgRole / requireWorker
middleware/validate.ts   unchanged (Zod)
middleware/upload.ts     multer (size/mime + magic-byte)
modules/auth/            me, bootstrap
modules/workers/         profile + credentials
modules/orgs/            org profile, members, locations
modules/chains/          catalog (public read; admin CRUD)
modules/admin/           users, orgs, credential review
prisma/seed.ts           platform RewardPolicy + super admin (idempotent)
supabase/policies/*.sql  RLS policies (versioned, applied via migration)
```

### Endpoints (all `/api/v1`; auth = Supabase Bearer)
| Endpoint | Access | Notes |
|---|---|---|
| `GET /auth/me` | any authed | resolved Profile + memberships + workerProfile + capabilities |
| `POST /auth/bootstrap` | any authed | first-login: create Profile (+ worker or org+owner membership) from sign-up intent; idempotent |
| `GET/PUT /workers/me/profile` | worker | workerRole, license, rate, location |
| `GET/POST /workers/me/credentials`, `DELETE /workers/me/credentials/:id` | worker | multipart upload to Supabase Storage; delete only if owned |
| `GET /workers/me/credentials/:id/file` | owner or super admin | authenticated download (stream or signed URL) |
| `GET/PUT /orgs/me` | owner | org profile + chain selection |
| `GET /orgs/me/members`, `POST/DELETE /orgs/me/members(/:id)` | owner | invite by email / remove; cannot remove last owner |
| `GET/POST/PUT/DELETE /orgs/me/locations(/:id)` | owner/manager | tenant-scoped; delete blocked if location has shifts (M3) |
| `GET /chains` | any authed | catalog for selection + logos |
| `POST/PUT/DELETE /admin/chains(/:id)` | super admin | manage catalog + logo upload |
| `GET /admin/users`, `PATCH /admin/users/:id` | super admin | list/filter; set status (ACTIVE/SUSPENDED); cannot suspend self |
| `GET /admin/orgs` | super admin | cross-tenant org list |
| `GET /admin/credentials?status=`, `PATCH /admin/credentials/:id` | super admin | approve/reject with notes |

## 5. Database & RLS
- New Prisma baseline against Supabase (see schema.prisma header note). `Profile.id` is UUID = `auth.uid()`.
- RLS enabled on all `public` business tables. Policy themes (SQL in `server/supabase/policies/`):
  - `Profile`: self read/update; super admin all.
  - Org-scoped tables (Organization, Membership, PharmacyLocation, Shift, Application, Booking, reward rows): access only to members of the owning org (via `Membership` matched on `auth.uid()`); super admin all.
  - `PharmacyChain`: read to all authenticated; write to super admin only.
  - Worker-owned tables (WorkerProfile, Credential, Availability, RewardAccount/Transaction/Redemption): owner by `auth.uid()`; super admin all.
  - Credential storage objects: private bucket; no public access.
- Express connects with a privileged role (bypasses RLS) → services MUST filter every org-scoped query by the caller's org. RLS is the authoritative guard for the supabase-js/client path. (See open decision on running Prisma under RLS.)

## 6. Client (`client/src/`)
```
lib/supabase.ts          supabase-js client (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
lib/api.ts               fetch wrapper: attaches current Supabase access token; on 401 refreshes session once
features/auth/           AuthContext (Supabase session -> /auth/me), RequireAuth, RequirePlatformRole, RequireOrgRole, Login, Register (intent picker: worker vs pharmacy), ForgotPassword
features/worker/         Dashboard, ProfilePage, CredentialsPage
features/org/            Dashboard, OrgProfilePage (chain picker), MembersPage, LocationsPage
features/admin/          AdminLayout, Users, Orgs, CredentialQueue, ChainsPage
components/              brand components (unchanged), AppShell role nav
pages/                   Landing, NotFound, Forbidden
```
- Routing by capability: `/worker/*`, `/org/*`, `/admin/*`; post-login redirect by resolved role; unauth → `/login`; wrong role → `/forbidden`.
- UI follows BRAND.md; mobile-first; clean/brand-forward direction carried into M3 listings.
- Env: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 7. New dependencies (approve in one go)
**Server:** `@supabase/supabase-js`, `jose` (JWKS verify); keep `zod`, `helmet`, `express-rate-limit`, `multer`, `file-type`. **Remove:** `jsonwebtoken`, `@types/jsonwebtoken`, `argon2`/`bcryptjs`, `cookie-parser`, `@types/cookie-parser`.
**Client:** `@supabase/supabase-js`; keep `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`.

## 8. Decisions requiring approval (carried to DECISIONS.md open list)
1. **Super admin mechanism** — Supabase user + `app_metadata.platform_role=SUPER_ADMIN` claim mirrored to `Profile` (recommended) vs separate mechanism.
2. **First-login provisioning** — Express `/auth/bootstrap` (recommended, explicit) vs Supabase DB trigger on `auth.users` insert.
3. **Prisma under RLS** — Express as trusted tier with in-code scoping (recommended) vs claim propagation so Prisma runs under RLS.
4. **Dependency swap** — approve add `@supabase/supabase-js` + `jose`; remove the custom-JWT/hashing/cookie deps.
5. **Credential download** — stream through Express (recommended; full auth control, consistent with M1 "no public URLs") vs short-lived Supabase signed URL.
6. **Reset migration history** — confirm it's acceptable to reset `prisma/migrations` to a new Supabase baseline (no production data exists yet).

## 9. User prerequisites (cannot be created by the build)
- **Supabase project** (staging to start): `SUPABASE_URL`, anon key, **service-role key**, `DATABASE_URL` (pooled) + `DIRECT_URL`, JWKS URL. Set by hand in `server/.env` / `client/.env` (never committed).
- Super-admin email/password (seed input). Stripe (M4) and Blackhawk (M3b) keys not needed for M2.

## 10. Acceptance criteria
**Setup**
- [ ] `npx prisma validate` passes; `migrate dev` applies the baseline to Supabase; `typecheck`/`build` pass for both apps.
- [ ] `GET /health` returns `{ status: "ok" }`.
- [ ] RLS enabled on all business tables; a direct supabase-js read of another tenant's row returns nothing.
- [ ] Super admin seeded (Profile + `app_metadata` claim); platform `RewardPolicy` seeded at 500 cents.

**Auth & provisioning**
- [ ] Sign up as a worker → Profile + WorkerProfile created → lands on worker dashboard; sign up as a pharmacy → Organization + owner Membership created → org dashboard.
- [ ] Session persists across reload (Supabase session); sign-out clears it; password reset email flow works.
- [ ] Express rejects a missing/invalid/expired token (401) and a wrong-role call (403) with `{error:{code,message}}`.

**Multi-tenant RBAC**
- [ ] Owner can edit org, invite a manager, add/edit/delete locations; manager can manage locations/shifts but not billing/members; worker hitting `/org` or `/admin` → Forbidden.
- [ ] Org A cannot read or mutate Org B's locations (API 404/403 and RLS both block).
- [ ] Super admin can list users/orgs across tenants and action the credential queue.

**Worker & credentials**
- [ ] Edit worker profile (role/license/rate/location) persists; invalid values rejected.
- [ ] Upload a PDF credential to Supabase Storage → PENDING; owner can download; non-owner cannot (403/404); `.exe`/oversize/renamed-non-PDF rejected.
- [ ] Super admin approves/rejects (with note); worker sees updated status.

**Chains & brand**
- [ ] Super admin creates a chain with a logo; org selects it; it is returned by `GET /chains` and shown in the org profile.
- [ ] At 375px nav collapses, forms usable, no horizontal scroll; brand palette + logo visible; focus rings present.

## 11. Testing strategy
Pre-handoff (developer): `npm run lint`, `typecheck`, `build` both apps; `prisma validate`; migration applied to Supabase; seed works. QA via Playwright (ADR-006), unique emails per run, API checks with `curl` for 401/403 and cross-tenant isolation; super-admin creds from local `.env`.

## 12. Risks & dependencies
- Depends on M1 (done) + a provisioned Supabase project (user prerequisite; cannot be created by the build).
- RLS + privileged Prisma connection: the biggest correctness risk is a service-layer query that forgets tenant scoping; mitigated by a shared org-scoping helper and cross-tenant QA checks.
- JWKS verification must cache keys and handle Supabase key rotation.
- Resetting migration history is safe only because no production data exists yet (confirm — decision 6).
- Credential documents are sensitive PII: private bucket, authenticated access only, no logging of contents.
- Scope/commercial: this rebuild is larger than the original M2 estimate (see MILESTONES.md commercial note).
