import path from "node:path";
import { env } from "../../config/env.js";
import { LocalStorageProvider } from "./local.js";
import { SupabaseStorageProvider } from "./supabase.js";
import type { StorageProvider } from "./types.js";

export type { StorageProvider } from "./types.js";

/** Credential-document storage (private `credentials` bucket in production). */
function build(): StorageProvider {
  switch (env.STORAGE_PROVIDER) {
    case "local":
      // UPLOAD_DIR is resolved relative to the server process cwd.
      return new LocalStorageProvider(path.resolve(process.cwd(), env.UPLOAD_DIR));
    case "supabase":
    default:
      return new SupabaseStorageProvider(env.CREDENTIALS_BUCKET);
  }
}

export const storage: StorageProvider = build();
