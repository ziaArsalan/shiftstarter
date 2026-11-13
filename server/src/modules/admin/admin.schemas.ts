import { z } from "zod";

export const listUsersQuery = z.object({
  platformRole: z.enum(["USER", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const listOrgsQuery = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParams = z.object({ id: z.string().min(1) });

export const updateUserSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const listCredentialsQuery = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const credentialIdParams = z.object({ id: z.string().min(1) });

export const reviewCredentialSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "reject" && !data.notes) {
      ctx.addIssue({ code: "custom", path: ["notes"], message: "A note is required when rejecting" });
    }
  });
