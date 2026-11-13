import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    intent: z.enum(["worker", "pharmacy"]),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().trim().optional(),
    workerRole: z
      .enum(["PHARMACIST", "PHARMACY_TECHNICIAN", "PHARMACY_ASSISTANT", "PHARMACY_STUDENT"])
      .optional(),
    organizationName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "worker") {
      if (!data.fullName)
        ctx.addIssue({ code: "custom", path: ["fullName"], message: "Your name is required" });
      if (!data.workerRole)
        ctx.addIssue({ code: "custom", path: ["workerRole"], message: "Select your role" });
    }
    if (data.intent === "pharmacy" && !data.organizationName) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Organization name is required",
      });
    }
  });
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
