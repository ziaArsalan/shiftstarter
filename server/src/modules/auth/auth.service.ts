import type { PlatformRole, WorkerProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { AuthContext } from "../../middleware/auth.js";
import type { BootstrapInput } from "./auth.schemas.js";

function serializeWorker(worker: WorkerProfile) {
  return {
    ...worker,
    hourlyRateExpectation:
      worker.hourlyRateExpectation === null ? null : Number(worker.hourlyRateExpectation),
  };
}

/** Platform role to persist, honouring the SUPER_ADMIN JWT claim. */
function platformRoleFromClaim(tokenPlatformRole?: string): PlatformRole {
  return tokenPlatformRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";
}

/**
 * Ensure a Profile row exists for the authenticated Supabase user. The claimed
 * platform role is mirrored onto the Profile so it is the single source of
 * truth for RBAC. Idempotent.
 */
export async function ensureProfile(auth: AuthContext) {
  const platformRole = platformRoleFromClaim(auth.tokenPlatformRole);
  const email = auth.email || auth.profile?.email;
  if (!email) throw AppError.validation("Authenticated user has no email");

  return prisma.profile.upsert({
    where: { id: auth.userId },
    create: { id: auth.userId, email, platformRole },
    // Keep the super-admin claim mirrored; never downgrade an existing admin
    // on a stale/absent claim.
    update: platformRole === "SUPER_ADMIN" ? { platformRole } : {},
  });
}

export async function bootstrap(auth: AuthContext, input: BootstrapInput) {
  await ensureProfile(auth);

  if (input.intent === "worker") {
    const existing = await prisma.workerProfile.findUnique({ where: { profileId: auth.userId } });
    await prisma.$transaction(async (tx) => {
      if (input.fullName || input.phone) {
        await tx.profile.update({
          where: { id: auth.userId },
          data: {
            ...(input.fullName ? { fullName: input.fullName } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
          },
        });
      }
      if (!existing) {
        await tx.workerProfile.create({
          data: { profileId: auth.userId, workerRole: input.workerRole! },
        });
      }
    });
  } else {
    // Pharmacy intent: create an Organization + owner Membership once.
    const existingMembership = await prisma.membership.findFirst({
      where: { profileId: auth.userId },
    });
    await prisma.$transaction(async (tx) => {
      if (input.fullName || input.phone) {
        await tx.profile.update({
          where: { id: auth.userId },
          data: {
            ...(input.fullName ? { fullName: input.fullName } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
          },
        });
      }
      if (!existingMembership) {
        if (input.chainId) {
          const chain = await tx.pharmacyChain.findUnique({ where: { id: input.chainId } });
          if (!chain) throw AppError.validation("Selected chain does not exist");
        }
        const org = await tx.organization.create({
          data: { name: input.organizationName!, chainId: input.chainId ?? null },
        });
        await tx.membership.create({
          data: { organizationId: org.id, profileId: auth.userId, role: "OWNER", status: "ACTIVE" },
        });
      }
    });
  }

  // Re-read the full, provisioned view.
  const fresh = await loadContext(auth.userId);
  return me(fresh);
}

/** Reload an AuthContext fresh from the DB (used after mutations). */
async function loadContext(userId: string): Promise<AuthContext> {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile) throw AppError.unauthorized();
  const [memberships, workerProfile] = await Promise.all([
    prisma.membership.findMany({ where: { profileId: userId, status: "ACTIVE" } }),
    prisma.workerProfile.findUnique({ where: { profileId: userId } }),
  ]);
  return {
    userId,
    email: profile.email,
    tokenPlatformRole: profile.platformRole,
    profile,
    memberships,
    workerProfile,
  };
}

export async function me(auth: AuthContext) {
  if (!auth.profile) {
    // Profile not provisioned yet — report the minimal identity so the client
    // can route the user into the sign-up/bootstrap flow.
    return {
      profile: null,
      worker: null,
      organizations: [],
      capabilities: {
        provisioned: false,
        isSuperAdmin: auth.tokenPlatformRole === "SUPER_ADMIN",
        isWorker: false,
        isOrgOwner: false,
        isOrgManager: false,
      },
    };
  }

  const memberships = await prisma.membership.findMany({
    where: { profileId: auth.userId, status: "ACTIVE" },
    include: { organization: { include: { chain: true } } },
    orderBy: { createdAt: "asc" },
  });

  const worker = auth.workerProfile ? serializeWorker(auth.workerProfile) : null;
  const isSuperAdmin = auth.profile.platformRole === "SUPER_ADMIN";
  const isOrgOwner = memberships.some((m) => m.role === "OWNER");
  const isOrgManager = memberships.some((m) => m.role === "MANAGER");

  return {
    profile: {
      id: auth.profile.id,
      email: auth.profile.email,
      fullName: auth.profile.fullName,
      phone: auth.profile.phone,
      avatarUrl: auth.profile.avatarUrl,
      platformRole: auth.profile.platformRole,
      status: auth.profile.status,
      createdAt: auth.profile.createdAt,
    },
    worker,
    organizations: memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      organization: m.organization,
    })),
    capabilities: {
      provisioned: true,
      isSuperAdmin,
      isWorker: !!worker,
      isOrgOwner,
      isOrgManager,
    },
  };
}
