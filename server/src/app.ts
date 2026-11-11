import express, { type Express } from "express";
import cors from "cors";

/**
 * Builds the Express app. Feature routes under /api/v1 are added in M2+.
 * See docs/ARCHITECTURE.md §6 for the planned API surface.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  // Health check — the only endpoint in the M1 scaffold.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "pharmacy-marketplace-api", version: "0.1.0" });
  });

  // app.use("/api/v1", apiRouter); // wired in M2

  return app;
}
