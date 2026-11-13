import { z } from "zod";

export const workerRoleEnum = z.enum([
  "PHARMACIST",
  "PHARMACY_TECHNICIAN",
  "PHARMACY_ASSISTANT",
  "PHARMACY_STUDENT",
]);

/**
 * First-login provisioning. The Supabase user already exists; this creates the
 * app-side Profile and, per sign-up intent, either a WorkerProfile or an
 * Organization + owner Membership. Idempotent (see auth.service.ts).
 */
export const bootstrapSchema = z
  .object({
    intent: z.enum(["worker", "pharmacy"]),
    fullName: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    workerRole: workerRoleEnum.optional(),
    organizationName: z.string().trim().min(1).max(200).optional(),
    chainId: z.string().trim().min(1).max(60).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "worker" && !data.workerRole) {
      ctx.addIssue({ code: "custom", path: ["workerRole"], message: "Worker role is required" });
    }
    if (data.intent === "pharmacy" && !data.organizationName) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Organization name is required",
      });
    }
  });

export type BootstrapInput = z.infer<typeof bootstrapSchema>;
