import { z } from "zod";

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional();

export const updateWorkerProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: optionalTrimmed(40),
  professionalTitle: optionalTrimmed(120),
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
