import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

export const passwordField = z.string().min(8, "Password must be at least 8 characters").max(200);

// ADMIN can never self-register.
export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    role: z.enum(["WORKER", "PHARMACY"]),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    businessName: z.string().trim().min(1).max(200).optional(),
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

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

// Refresh/logout accept the token from the cookie (preferred) or the body (mobile fallback).
export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
