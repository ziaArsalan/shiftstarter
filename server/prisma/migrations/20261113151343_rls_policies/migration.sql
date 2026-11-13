-- ShiftStarter — Row-Level Security policies (M2).
--
-- Authoritative guard for the DIRECT supabase-js / PostgREST client path.
-- The Express API connects as the table-owner role (bypasses RLS) and enforces
-- tenant scoping in its service layer; these policies are defense-in-depth for
-- the API path and the primary guard for any direct client DB access.
-- See docs/ARCHITECTURE.md §4.4. Idempotent: safe to re-run.
--
-- Model name -> table name mapping is 1:1 (Prisma PascalCase, quoted).

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they bypass RLS and avoid recursion).
-- ---------------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'platform_role') = 'SUPER_ADMIN',
    false
  );
$$;

create or replace function public.is_org_member(org text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from "Membership" m
    where m."organizationId" = org
      and m."profileId" = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.is_org_owner(org text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from "Membership" m
    where m."organizationId" = org
      and m."profileId" = auth.uid()
      and m.role = 'OWNER'
      and m.status = 'ACTIVE'
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every business table. Tables without a permissive policy are
-- fully denied on the client path (M3/M4 tables are reached only via Express).
-- ---------------------------------------------------------------------------

alter table "Profile"            enable row level security;
alter table "Organization"       enable row level security;
alter table "Membership"         enable row level security;
alter table "PharmacyChain"      enable row level security;
alter table "WorkerProfile"      enable row level security;
alter table "Credential"         enable row level security;
alter table "Availability"       enable row level security;
alter table "PharmacyLocation"   enable row level security;
alter table "Shift"              enable row level security;
alter table "Application"        enable row level security;
alter table "Booking"            enable row level security;
alter table "Conversation"       enable row level security;
alter table "Message"            enable row level security;
alter table "Notification"       enable row level security;
alter table "Payment"            enable row level security;
alter table "Review"             enable row level security;
alter table "Dispute"            enable row level security;
alter table "RewardAccount"      enable row level security;
alter table "RewardTransaction"  enable row level security;
alter table "RewardRedemption"   enable row level security;
alter table "RewardPolicy"       enable row level security;

-- Read access for the authenticated client path (RLS scopes the rows).
grant select on
  "Profile", "Organization", "Membership", "PharmacyChain",
  "WorkerProfile", "Credential", "Availability", "PharmacyLocation"
to authenticated;

-- ---------------------------------------------------------------------------
-- Policies (client path = role `authenticated`). Writes go through Express.
-- ---------------------------------------------------------------------------

-- Profile: self or super admin.
drop policy if exists profile_select on "Profile";
create policy profile_select on "Profile"
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

-- Organization: members of the org, or super admin.
drop policy if exists organization_select on "Organization";
create policy organization_select on "Organization"
  for select to authenticated
  using (public.is_super_admin() or public.is_org_member(id));

-- Membership: own rows, fellow members of the same org, or super admin.
drop policy if exists membership_select on "Membership";
create policy membership_select on "Membership"
  for select to authenticated
  using (
    "profileId" = auth.uid()
    or public.is_super_admin()
    or public.is_org_member("organizationId")
  );

-- PharmacyChain: readable by all authenticated users (catalog).
drop policy if exists chain_select on "PharmacyChain";
create policy chain_select on "PharmacyChain"
  for select to authenticated
  using (true);

-- WorkerProfile: owner or super admin.
drop policy if exists worker_select on "WorkerProfile";
create policy worker_select on "WorkerProfile"
  for select to authenticated
  using ("profileId" = auth.uid() or public.is_super_admin());

-- Credential: owned by the worker, or super admin (review queue).
drop policy if exists credential_select on "Credential";
create policy credential_select on "Credential"
  for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from "WorkerProfile" w
      where w.id = "Credential"."workerId" and w."profileId" = auth.uid()
    )
  );

-- Availability: owned by the worker, or super admin.
drop policy if exists availability_select on "Availability";
create policy availability_select on "Availability"
  for select to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from "WorkerProfile" w
      where w.id = "Availability"."workerId" and w."profileId" = auth.uid()
    )
  );

-- PharmacyLocation: members of the owning org, or super admin.
drop policy if exists location_select on "PharmacyLocation";
create policy location_select on "PharmacyLocation"
  for select to authenticated
  using (public.is_super_admin() or public.is_org_member("organizationId"));
