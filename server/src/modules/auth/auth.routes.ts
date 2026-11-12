import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, refreshBodySchema, registerSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate({ body: registerSchema }), asyncHandler(controller.register));
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), asyncHandler(controller.login));
authRouter.post("/refresh", authLimiter, validate({ body: refreshBodySchema }), asyncHandler(controller.refresh));
authRouter.post("/logout", validate({ body: refreshBodySchema }), asyncHandler(controller.logout));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
