import type { Prisma, PlatformRole, UserStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";

interface ListUsersArgs {
  platformRole?: PlatformRole;
  status?: UserStatus;
  q?: string;
  page: number;
  pageSize: number;
}

export async function listUsers(args: ListUsersArgs) {
  const where: Prisma.ProfileWhereInput = {};
  if (args.platformRole) where.platformRole = args.platformRole;
  if (args.status) where.status = args.status;
  if (args.q) {
    where.OR = [
      { email: { contains: args.q, mode: "insensitive" } },
      { fullName: { contains: args.q, mode: "insensitive" } },
    ];
  }

  const [total, profiles] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (args.page - 1) * args.pageSize,
      take: args.pageSize,
      select: {
        id: true,
        email: true,
        fullName: true,
        platformRole: true,
        status: true,
        createdAt: true,
        workerProfile: { select: { workerRole: true } },
        _count: { select: { memberships: true } },
      },
    }),
  ]);

  return {
    users: profiles.map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.fullName,
      platformRole: p.platformRole,
      status: p.status,
      createdAt: p.createdAt,
      workerRole: p.workerProfile?.workerRole ?? null,
      orgCount: p._count.memberships,
    })),
    page: args.page,
    pageSize: args.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / args.pageSize)),
  };
}

export async function updateUserStatus(adminId: string, userId: string, status: UserStatus) {
  if (userId === adminId) throw AppError.forbidden("You cannot change your own account status");

  const target = await prisma.profile.findUnique({ where: { id: userId } });
  if (!target) throw AppError.notFound("User not found");
  if (target.platformRole === "SUPER_ADMIN") {
    throw AppError.forbidden("Super-admin accounts cannot be modified here");
  }

  return prisma.profile.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, platformRole: true, status: true },
  });
}

interface ListOrgsArgs {
  q?: string;
  page: number;
  pageSize: number;
}

export async function listOrgs(args: ListOrgsArgs) {
  const where: Prisma.OrganizationWhereInput = {};
  if (args.q) where.name = { contains: args.q, mode: "insensitive" };

  const [total, orgs] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (args.page - 1) * args.pageSize,
      take: args.pageSize,
      include: {
        chain: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { memberships: true, locations: true } },
      },
    }),
  ]);

  return {
    orgs: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      status: o.status,
      createdAt: o.createdAt,
      chain: o.chain,
      memberCount: o._count.memberships,
      locationCount: o._count.locations,
    })),
    page: args.page,
    pageSize: args.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / args.pageSize)),
  };
}

interface ListCredentialsArgs {
  status?: VerificationStatus;
  page: number;
  pageSize: number;
}

export async function listCredentials(args: ListCredentialsArgs) {
  const where: Prisma.CredentialWhereInput = {};
  if (args.status) where.status = args.status;

  const [total, credentials] = await Promise.all([
    prisma.credential.count({ where }),
    prisma.credential.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (args.page - 1) * args.pageSize,
      take: args.pageSize,
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        reviewedBy: true,
        reviewedAt: true,
        notes: true,
        createdAt: true,
        worker: {
          select: {
            id: true,
            workerRole: true,
            profile: { select: { id: true, email: true, fullName: true } },
          },
        },
      },
    }),
  ]);

  return {
    credentials: credentials.map((c) => ({
      id: c.id,
      type: c.type,
      fileName: c.fileName,
      mimeType: c.mimeType,
      sizeBytes: c.sizeBytes,
      status: c.status,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt,
      notes: c.notes,
      createdAt: c.createdAt,
      worker: {
        id: c.worker.id,
        workerRole: c.worker.workerRole,
        name: c.worker.profile.fullName,
        email: c.worker.profile.email,
      },
    })),
    page: args.page,
    pageSize: args.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / args.pageSize)),
  };
}

export async function reviewCredential(
  adminId: string,
  credentialId: string,
  action: "approve" | "reject",
  notes?: string,
) {
  const credential = await prisma.credential.findUnique({ where: { id: credentialId } });
  if (!credential) throw AppError.notFound("Credential not found");

  return prisma.credential.update({
    where: { id: credentialId },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      notes: notes ?? null,
    },
    select: { id: true, status: true, reviewedBy: true, reviewedAt: true, notes: true },
  });
}
