import { z } from "zod";

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional();

export const workerRoleEnum = z.enum([
  "PHARMACIST",
  "PHARMACY_TECHNICIAN",
  "PHARMACY_ASSISTANT",
  "PHARMACY_STUDENT",
]);

export const updateWorkerProfileSchema = z.object({
  // Profile-level fields (name/phone live on Profile, not WorkerProfile).
  fullName: optionalTrimmed(200),
  phone: optionalTrimmed(40),
  // WorkerProfile fields.
  workerRole: workerRoleEnum.optional(),
  licenseNumber: optionalTrimmed(120),
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  bio: z.string().trim().max(2000).optional(),
  hourlyRateExpectation: z.number().min(0).max(100000).nullable().optional(),
  addressLine1: optionalTrimmed(200),
  city: optionalTrimmed(120),
  state: optionalTrimmed(120),
  postalCode: optionalTrimmed(20),
  country: optionalTrimmed(120),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

// Multipart text fields arrive as strings; coerce dates and validate the type.
export const createCredentialSchema = z.object({
  type: z.enum(["LICENSE", "GOVERNMENT_ID", "CERTIFICATION", "INSURANCE", "OTHER"]),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const credentialIdParams = z.object({ id: z.string().min(1) });

export type UpdateWorkerProfileInput = z.infer<typeof updateWorkerProfileSchema>;
