import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import type { StorageProvider } from "./types.js";

/**
 * Stores files on local disk under a base directory. Keys may contain forward
 * slashes (e.g. "credentials/<id>"); traversal outside the base is rejected.
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    const full = path.resolve(this.baseDir, key);
    const base = path.resolve(this.baseDir);
    if (full !== base && !full.startsWith(base + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async save(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, data);
  }

  async createReadStream(key: string): Promise<Readable> {
    return fs.createReadStream(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await fsp.rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fsp.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
