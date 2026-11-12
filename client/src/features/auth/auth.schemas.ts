import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    role: z.enum(["WORKER", "PHARMACY"]),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    businessName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "WORKER") {
      if (!data.firstName)
        ctx.addIssue({ code: "custom", path: ["firstName"], message: "First name is required" });
      if (!data.lastName)
        ctx.addIssue({ code: "custom", path: ["lastName"], message: "Last name is required" });
    }
    if (data.role === "PHARMACY" && !data.businessName) {
      ctx.addIssue({ code: "custom", path: ["businessName"], message: "Business name is required" });
    }
  });
export type RegisterForm = z.infer<typeof registerSchema>;
