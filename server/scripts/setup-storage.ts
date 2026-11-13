import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Idempotently create the Supabase Storage buckets used by ShiftStarter:
 *   - `credentials`  (PRIVATE)  — worker credential documents
 *   - `brand-assets` (PUBLIC)   — pharmacy-chain logos
 * Run with: npm run setup:storage. Uses the service-role key; never logs it.
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CREDENTIALS_BUCKET = process.env.CREDENTIALS_BUCKET ?? "credentials";
const BRAND_ASSETS_BUCKET = process.env.BRAND_ASSETS_BUCKET ?? "brand-assets";
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? "10");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[storage] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureBucket(
  id: string,
  opts: { public: boolean; allowedMimeTypes?: string[] },
) {
  const { data: existing } = await supabase.storage.getBucket(id);
  const fileSizeLimit = `${MAX_UPLOAD_MB}MB`;

  if (existing) {
    const { error } = await supabase.storage.updateBucket(id, {
      public: opts.public,
      fileSizeLimit,
      allowedMimeTypes: opts.allowedMimeTypes,
    });
    if (error) throw error;
    console.log(`[storage] Bucket "${id}" updated (public=${opts.public}).`);
    return;
  }

  const { error } = await supabase.storage.createBucket(id, {
    public: opts.public,
    fileSizeLimit,
    allowedMimeTypes: opts.allowedMimeTypes,
  });
  if (error) throw error;
  console.log(`[storage] Bucket "${id}" created (public=${opts.public}).`);
}

async function main() {
  await ensureBucket(CREDENTIALS_BUCKET, {
    public: false,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  });
  await ensureBucket(BRAND_ASSETS_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png"],
  });
  console.log("[storage] Buckets ready.");
}

main().catch((err) => {
  console.error("[storage] Failed:", err);
  process.exit(1);
});
