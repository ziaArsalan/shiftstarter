import argon2 from "argon2";
import type { Role, User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from "../../lib/tokens.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

// A valid argon2id hash used only to equalise verify timing on unknown emails.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$QpRtO7G3K1QNvArqM3/Pbg$FJAPYIf1bUyahJLIpD/qCjQii8dMZcf45ByLsCIYNmg";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function issueTokens(user: Pick<User, "id" | "role">): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token, tokenHash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt: refreshTokenExpiry() },
  });
  return { accessToken, refreshToken: token };
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: input.email, passwordHash, role: input.role as Role },
    });
    if (input.role === "WORKER") {
      await tx.workerProfile.create({
        data: { userId: created.id, firstName: input.firstName!, lastName: input.lastName! },
      });
    } else {
      await tx.pharmacyProfile.create({
        data: { userId: created.id, businessName: input.businessName! },
      });
    }
    return created;
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const genericError = AppError.unauthorized("Invalid email or password");
  if (!user) {
    // Still run a verify to blunt timing-based account enumeration.
    await argon2.verify(DUMMY_HASH, input.password).catch(() => false);
    throw genericError;
  }

  const valid = await argon2.verify(user.passwordHash, input.password).catch(() => false);
  if (!valid) throw genericError;

  if (user.status === "SUSPENDED") {
    throw AppError.forbidden("This account has been suspended. Contact support.");
  }

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(rawToken: string | undefined) {
  if (!rawToken) throw AppError.unauthorized("Missing refresh token");
  const tokenHash = hashRefreshToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) throw AppError.unauthorized("Invalid refresh token");

  // Reuse of an already-revoked token => likely theft: revoke the whole family.
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw AppError.unauthorized("Refresh token reuse detected");
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized("Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) throw AppError.unauthorized("Invalid refresh token");
  if (user.status === "SUSPENDED") throw AppError.forbidden("This account has been suspended.");

  // Rotate: revoke the presented token, issue a fresh pair.
  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workerProfile: { select: { id: true, firstName: true, lastName: true } },
      pharmacyProfile: { select: { id: true, businessName: true } },
    },
  });
  if (!user) throw AppError.unauthorized();

  const profile =
    user.role === "WORKER"
      ? user.workerProfile
        ? {
            id: user.workerProfile.id,
            displayName: `${user.workerProfile.firstName} ${user.workerProfile.lastName}`.trim(),
          }
        : null
      : user.role === "PHARMACY"
        ? user.pharmacyProfile
          ? { id: user.pharmacyProfile.id, displayName: user.pharmacyProfile.businessName }
          : null
        : null;

  return { ...publicUser(user), profile };
}
