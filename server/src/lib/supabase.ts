import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Service-role Supabase client — used server-side ONLY for privileged
 * operations: Storage reads/writes and the Admin Auth API (seeding the super
 * admin, setting custom claims). The service-role key bypasses RLS, so this
 * client must never be exposed to the browser. Request-level tenant scoping is
 * enforced in the Express service layer; RLS guards the direct client path.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
