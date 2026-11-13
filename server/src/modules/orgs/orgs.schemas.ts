import { z } from "zod";

export const updateOrgSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  website: z.string().trim().url("Enter a valid URL").max(200).optional().or(z.literal("")),
  // null clears the chain (independent pharmacy); a string selects a catalog chain.
  chainId: z.string().trim().min(1).max(60).nullable().optional(),
});

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((v) => v.toLowerCase()),
  role: z.enum(["OWNER", "MANAGER"]).default("MANAGER"),
});

export const memberIdParams = z.object({ id: z.string().min(1) });

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(120),
  chainId: z.string().trim().min(1).max(60).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const locationIdParams = z.object({ id: z.string().min(1) });

export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
