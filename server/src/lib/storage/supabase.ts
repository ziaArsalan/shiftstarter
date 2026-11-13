import path from "node:path";
import { Readable } from "node:stream";
import { supabaseAdmin } from "../supabase.js";
import type { StorageProvider } from "./types.js";

/**
 * Supabase Storage implementation of the StorageProvider interface. Uses the
 * service-role client, so all access control happens in the Express service
 * layer / authenticated download endpoint. Credential files live in a PRIVATE
 * bucket and are never exposed via public URLs.
 */
export class SupabaseStorageProvider implements StorageProvider {
  constructor(private readonly bucket: string) {}

  async save(key: string, data: Buffer, mimeType: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .upload(key, data, { contentType: mimeType, upsert: true });
    if (error) throw error;
  }

  async createReadStream(key: string): Promise<Readable> {
    const { data, error } = await supabaseAdmin.storage.from(this.bucket).download(key);
    if (error || !data) throw error ?? new Error("Stored object not found");
    const buffer = Buffer.from(await data.arrayBuffer());
    return Readable.from(buffer);
  }

  async delete(key: string): Promise<void> {
    await supabaseAdmin.storage.from(this.bucket).remove([key]);
  }

  async exists(key: string): Promise<boolean> {
    const dir = path.posix.dirname(key);
    const base = path.posix.basename(key);
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .list(dir === "." ? "" : dir, { search: base });
    if (error) return false;
    return !!data?.some((obj) => obj.name === base);
  }
}
