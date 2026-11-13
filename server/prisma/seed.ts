import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/**
 * Idempotent seed:
 *  1. Platform-default RewardPolicy (organizationId = null) at 500 cents ($5 CAD).
 *  2. Super admin — a Supabase auth user carrying app_metadata.platform_role =
 *     SUPER_ADMIN, mirrored to a Profile row (Profile.id = the auth UUID).
 *
 * Requires SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD and the Supabase
 * service-role credentials in server/.env. Never logs secret values.
 */
const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seedRewardPolicy() {
  const existing = await prisma.rewardPolicy.findFirst({ where: { organizationId: null } });
  if (existing) {
    console.log(`[seed] Platform RewardPolicy present (${existing.earnAmountCents} cents).`);
    return;
  }
  const policy = await prisma.rewardPolicy.create({
    data: { organizationId: null, earnAmountCents: 500, currency: "cad", active: true },
  });
  console.log(`[seed] Platform RewardPolicy created (${policy.earnAmountCents} cents).`);
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[seed] SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin.");
    return;
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[seed] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required to seed the super admin.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const appMetadata = { platform_role: "SUPER_ADMIN" };

  // Create the auth user, or locate + update the existing one.
  let userId: string | undefined;
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });

  if (created.data.user) {
    userId = created.data.user.id;
    console.log("[seed] Super-admin Supabase user created.");
  } else {
    // Likely already exists — find it by paging the user list.
    let page = 1;
    while (!userId) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const match = data.users.find((u) => u.email?.toLowerCase() === email);
      if (match) {
        userId = match.id;
        await supabase.auth.admin.updateUserById(match.id, { app_metadata: appMetadata });
        console.log("[seed] Existing super-admin user found; claim re-applied.");
        break;
      }
      if (data.users.length < 200) break;
      page += 1;
    }
  }

  if (!userId) {
    console.error("[seed] Could not create or locate the super-admin auth user.");
    process.exit(1);
  }

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: { platformRole: "SUPER_ADMIN", status: "ACTIVE", email },
    create: { id: userId, email, platformRole: "SUPER_ADMIN", status: "ACTIVE" },
  });
  console.log(`[seed] Super-admin Profile ready: ${profile.email}`);
}

async function main() {
  await seedRewardPolicy();
  await seedSuperAdmin();
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
