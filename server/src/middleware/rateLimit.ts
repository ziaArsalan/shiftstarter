import rateLimit from "express-rate-limit";
import { AppError } from "../lib/errors.js";

/** Throttle sensitive auth endpoints to slow credential-stuffing/brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError("RATE_LIMITED", 429, "Too many attempts. Please try again later."));
  },
});
