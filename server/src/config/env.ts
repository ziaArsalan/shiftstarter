import "dotenv/config";
import { z } from "zod";

/**
 * Environment configuration, validated once at startup (fail fast).
 * Supabase powers Auth + Storage + managed Postgres (see docs/ARCHITECTURE.md §2).
 * Secrets never have defaults.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),

  // Database (Supabase-managed Postgres)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"), // pooled (pgbouncer)
  DIRECT_URL: z.string().min(1).optional(), // direct connection for migrations

  // Supabase Auth + Storage + Admin API
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_JWKS_URL: z.string().url("SUPABASE_JWKS_URL must be a valid URL"),

  // Storage
  STORAGE_PROVIDER: z.enum(["supabase", "local"]).default("supabase"),
  CREDENTIALS_BUCKET: z.string().default("credentials"),
  BRAND_ASSETS_BUCKET: z.string().default("brand-assets"),
  UPLOAD_DIR: z.string().default("uploads"), // only used by the local provider
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),

  // Super-admin seed (only required by prisma/seed.ts)
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
