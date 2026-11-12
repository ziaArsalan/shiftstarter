import type { Prisma, Role, UserStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";

interface ListUsersArgs {
  role?: Role;
  status?: UserStatus;
  page: number;
  pageSize: number;
}

export async function listUsers(args: ListUsersArgs) {
  const where: Prisma.UserWhereInput = {};
  if (args.role) where.role = args.role;
  if (args.status) where.status = args.status;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (args.page - 1) * args.pageSize,
      take: args.pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        workerProfile: { select: { firstName: true, lastName: true } },
        pharmacyProfile: { select: { businessName: true } },
      },
    }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      displayName: u.workerProfile
        ? `${u.workerProfile.firstName} ${u.workerProfile.lastName}`.trim()
        : (u.pharmacyProfile?.businessName ?? null),
    })),
    page: args.page,
    pageSize: args.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / args.pageSize)),
  };
}

export async function updateUserStatus(adminId: string, userId: string, status: UserStatus) {
  if (userId === adminId) throw AppError.forbidden("You cannot change your own account status");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw AppError.notFound("User not found");
  if (target.role === "ADMIN") throw AppError.forbidden("Admin accounts cannot be modified here");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, role: true, status: true },
  });

  // Suspending a user revokes their active refresh tokens immediately.
  if (status === "SUSPENDED") {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  return updated;
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
            firstName: true,
            lastName: true,
            user: { select: { id: true, email: true } },
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
        name: `${c.worker.firstName} ${c.worker.lastName}`.trim(),
        email: c.worker.user.email,
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
