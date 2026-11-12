import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth from a verified access token. */
      user?: { id: string; role: Role };
    }
  }
}

export {};
