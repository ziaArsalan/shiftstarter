import type { AuthContext } from "../middleware/auth.js";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth after verifying the Supabase access token. */
      auth?: AuthContext;
    }
  }
}

export {};
