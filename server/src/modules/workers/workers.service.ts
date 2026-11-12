import type { WorkerProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { UpdateWorkerProfileInput } from "./workers.schemas.js";

function serialize(profile: WorkerProfile) {
  return {
    ...profile,
    hourlyRateExpectation:
      profile.hourlyRateExpectation === null ? null : Number(profile.hourlyRateExpectation),
  };
}

/** Resolve the WorkerProfile id for a user, creating a stub if missing. */
export async function getProfileByUserId(userId: string) {
  const profile = await prisma.workerProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound("Worker profile not found");
  return serialize(profile);
}

export async function updateProfile(userId: string, input: UpdateWorkerProfileInput) {
  const existing = await prisma.workerProfile.findUnique({ where: { userId } });
  if (!existing) throw AppError.notFound("Worker profile not found");

  const updated = await prisma.workerProfile.update({
    where: { userId },
    data: input,
  });
  return serialize(updated);
}

/** Internal: get the worker profile id for the authenticated user. */
export async function requireProfileId(userId: string): Promise<string> {
  const profile = await prisma.workerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw AppError.notFound("Worker profile not found");
  return profile.id;
}
