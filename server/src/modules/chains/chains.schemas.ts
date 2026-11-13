import { z } from "zod";

export const createChainSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug may contain only lowercase letters, numbers, and hyphens")
    .optional(),
  website: z.string().trim().url("Enter a valid URL").max(200).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export const updateChainSchema = createChainSchema.partial();

export const chainIdParams = z.object({ id: z.string().min(1) });

export type CreateChainInput = z.infer<typeof createChainSchema>;
export type UpdateChainInput = z.infer<typeof updateChainSchema>;
