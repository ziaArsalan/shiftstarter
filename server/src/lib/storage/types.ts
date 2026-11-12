import type { Readable } from "node:stream";

/**
 * Abstraction over credential-document storage. The local-disk implementation
 * is used for dev/staging; an S3-compatible provider can be dropped in for
 * production (tracked for M5) without touching callers. Files are never served
 * via public URLs — only through the authenticated download endpoint.
 */
export interface StorageProvider {
  /** Persist bytes under a generated key; returns the storage key. */
  save(key: string, data: Buffer, mimeType: string): Promise<void>;
  /** Open a readable stream for a stored key. */
  createReadStream(key: string): Readable;
  /** Remove a stored object; no-op if already gone. */
  delete(key: string): Promise<void>;
  /** Whether an object exists for the key. */
  exists(key: string): Promise<boolean>;
}
