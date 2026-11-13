import type { Readable } from "node:stream";

/**
 * Abstraction over credential-document storage. The production implementation
 * is Supabase Storage (private `credentials` bucket); a local-disk impl is
 * retained for tests/offline dev. Files are never served via public URLs —
 * only through the authenticated download endpoint (see docs/ARCHITECTURE.md §9).
 */
export interface StorageProvider {
  /** Persist bytes under a generated key. */
  save(key: string, data: Buffer, mimeType: string): Promise<void>;
  /** Open a readable stream for a stored key. Async to support remote stores. */
  createReadStream(key: string): Promise<Readable>;
  /** Remove a stored object; no-op if already gone. */
  delete(key: string): Promise<void>;
  /** Whether an object exists for the key. */
  exists(key: string): Promise<boolean>;
}
