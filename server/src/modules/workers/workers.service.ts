import type { Profile, WorkerProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type { UpdateWorkerProfileInput } from "./workers.schemas.js";

function serialize(worker: WorkerProfile, profile: Pick<Profile, "fullName" | "phone" | "email">) {
  return {
    ...worker,
    hourlyRateExpectation:
      worker.hourlyRateExpectation === null ? null : Number(worker.hourlyRateExpectation),
    fullName: profile.fullName,
    phone: profile.phone,
    email: profile.email,
  };
}

/** Resolve the WorkerProfile (+ owning profile) for a Supabase user id. */
export async function getProfileByUserId(userId: string) {
  const worker = await prisma.workerProfile.findUnique({
    where: { profileId: userId },
    include: { profile: { select: { fullName: true, phone: true, email: true } } },
  });
  if (!worker) throw AppError.notFound("Worker profile not found");
  const { profile, ...rest } = worker;
  return serialize(rest as WorkerProfile, profile);
}

export async function updateProfile(userId: string, input: UpdateWorkerProfileInput) {
  const existing = await prisma.workerProfile.findUnique({ where: { profileId: userId } });
  if (!existing) throw AppError.notFound("Worker profile not found");

  const { fullName, phone, ...workerFields } = input;

  const [, worker] = await prisma.$transaction([
    prisma.profile.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    }),
    prisma.workerProfile.update({ where: { profileId: userId }, data: workerFields }),
  ]);

  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: userId },
    select: { fullName: true, phone: true, email: true },
  });
  return serialize(worker, profile);
}

/** Internal: get the WorkerProfile id for a Supabase user. */
export async function requireProfileId(userId: string): Promise<string> {
  const worker = await prisma.workerProfile.findUnique({
    where: { profileId: userId },
    select: { id: true },
  });
  if (!worker) throw AppError.notFound("Worker profile not found");
  return worker.id;
}
