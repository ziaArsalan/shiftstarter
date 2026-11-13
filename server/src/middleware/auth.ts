import type { NextFunction, Request, Response } from "express";
import type { Membership, Profile, WorkerProfile } from "@prisma/client";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { verifySupabaseToken } from "../lib/jwks.js";

/** Resolved caller context attached by requireAuth. */
export interface AuthContext {
  /** Supabase auth user UUID (= Profile.id, auth.uid()). */
  userId: string;
  email: string;
  /** platform_role claim from the Supabase JWT app_metadata, if present. */
  tokenPlatformRole?: string;
  /** Provisioned profile, or null before /auth/bootstrap runs. */
  profile: Profile | null;
  /** Active org memberships for the caller. */
  memberships: Membership[];
  /** Worker profile, if the caller is a worker. */
  workerProfile: WorkerProfile | null;
}

/**
 * Verify the Supabase access token (Bearer) against the project JWKS, then load
 * the caller's Profile, active memberships, and worker profile into req.auth.
 * The profile may be null on first login (before bootstrap); routes that need a
 * provisioned profile use requireProfile (see middleware/rbac.ts).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized());
  }
  const token = header.slice("Bearer ".length).trim();

  let claims;
  try {
    claims = await verifySupabaseToken(token);
  } catch {
    return next(AppError.unauthorized("Invalid or expired token"));
  }

  try {
    const profile = await prisma.profile.findUnique({ where: { id: claims.sub } });

    if (profile && profile.status === "SUSPENDED") {
      return next(AppError.forbidden("This account has been suspended. Contact support."));
    }

    const [memberships, workerProfile] = profile
      ? await Promise.all([
          prisma.membership.findMany({ where: { profileId: profile.id, status: "ACTIVE" } }),
          prisma.workerProfile.findUnique({ where: { profileId: profile.id } }),
        ])
      : [[], null];

    req.auth = {
      userId: claims.sub,
      email: claims.email ?? profile?.email ?? "",
      tokenPlatformRole: claims.app_metadata?.platform_role,
      profile,
      memberships,
      workerProfile,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Narrowing helper: the request is authenticated (requireAuth ran first). */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}
