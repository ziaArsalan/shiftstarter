import type { NextFunction, Request, Response } from "express";
import type { Membership, OrgRole, PlatformRole } from "@prisma/client";
import { AppError } from "../lib/errors.js";
import { getAuth } from "./auth.js";

/** Require that the caller has a provisioned Profile (bootstrap has run). */
export function requireProfile(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.profile) {
    return next(AppError.forbidden("Account not provisioned. Complete sign-up first."));
  }
  return next();
}

/** Restrict to one or more platform roles (e.g. SUPER_ADMIN). */
export function requirePlatformRole(...roles: PlatformRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    if (!auth.profile || !roles.includes(auth.profile.platformRole)) {
      return next(AppError.forbidden());
    }
    return next();
  };
}

/** Require that the caller has a worker profile. */
export function requireWorker(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.workerProfile) {
    return next(AppError.forbidden("A worker profile is required for this action"));
  }
  return next();
}

/**
 * Resolve the caller's single active org membership ("my org"). For M2 a
 * profile belongs to at most one organization. Throws 403 if none.
 */
export function resolveMembership(req: Request): Membership {
  const auth = getAuth(req);
  const membership = auth.memberships[0];
  if (!membership) throw AppError.forbidden("You are not a member of any organization");
  return membership;
}

/** Restrict to org members holding one of the given org roles (OWNER/MANAGER). */
export function requireOrgRole(...roles: OrgRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = getAuth(req);
    const membership = auth.memberships[0];
    if (!membership) {
      return next(AppError.forbidden("You are not a member of any organization"));
    }
    if (!roles.includes(membership.role)) {
      return next(AppError.forbidden());
    }
    return next();
  };
}
