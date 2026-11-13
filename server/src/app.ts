import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { AppError, errorHandler } from "./lib/errors.js";
import { apiRouter } from "./routes/index.js";

/**
 * Builds the Express app. Feature routes live under /api/v1.
 * See docs/ARCHITECTURE.md §6 for the API surface.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      // Supabase sessions ride in the Authorization header, not cookies.
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  // Health check — unchanged from the M1 scaffold.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "pharmacy-marketplace-api", version: "0.1.0" });
  });

  app.use("/api/v1", apiRouter);

  // Unknown route under the API -> 404 in the standard error shape.
  app.use((_req, _res, next) => {
    next(AppError.notFound("Route not found"));
  });

  app.use(errorHandler);

  return app;
}
