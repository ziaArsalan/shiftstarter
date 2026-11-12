import { z } from "zod";

export const updatePharmacyProfileSchema = z.object({
  businessName: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  website: z.string().trim().url("Enter a valid URL").max(200).optional().or(z.literal("")),
});

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(120),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const locationIdParams = z.object({ id: z.string().min(1) });

export type UpdatePharmacyProfileInput = z.infer<typeof updatePharmacyProfileSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
