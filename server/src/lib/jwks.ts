import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";

/**
 * Cached remote JWKS for verifying Supabase access tokens. `createRemoteJWKSet`
 * fetches and caches the signing keys and transparently re-fetches on key
 * rotation (Supabase asymmetric JWT signing keys). See docs/ARCHITECTURE.md §4.3.
 */
const jwks = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL));

export interface SupabaseClaims extends JWTPayload {
  sub: string;
  email?: string;
  role?: string; // Postgres role ("authenticated"), not the app role
  app_metadata?: { platform_role?: string; [k: string]: unknown };
  user_metadata?: Record<string, unknown>;
}

/**
 * Verify a Supabase access token against the project JWKS. Throws on an
 * invalid/expired signature. Returns the decoded claims.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseClaims> {
  const { payload } = await jwtVerify(token, jwks);
  if (!payload.sub) throw new Error("Token is missing a subject");
  return payload as SupabaseClaims;
}
