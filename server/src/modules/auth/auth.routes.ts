import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { bootstrapSchema } from "./auth.schemas.js";

export const authRouter = Router();

// Sign-up / sign-in / reset happen client-side against Supabase. Express only
// resolves and provisions the app-side identity.
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
authRouter.post(
  "/bootstrap",
  requireAuth,
  validate({ body: bootstrapSchema }),
  asyncHandler(controller.bootstrap),
);
