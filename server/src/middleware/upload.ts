import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_BYTES = env.MAX_UPLOAD_MB * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    // First-pass check on the declared type; magic bytes are verified later.
    if (!ALLOWED_MIME.includes(file.mimetype as (typeof ALLOWED_MIME)[number])) {
      cb(new AppError("UNSUPPORTED_MEDIA_TYPE", 415, "Only PDF, JPEG, or PNG files are allowed"));
      return;
    }
    cb(null, true);
  },
});

/** Accept a single file in the `file` field, translating multer errors to AppError. */
export function uploadSingle(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError("PAYLOAD_TOO_LARGE", 413, `File exceeds the ${env.MAX_UPLOAD_MB} MB limit`),
        );
      }
      return next(AppError.validation(err.message));
    }
    return next(err);
  });
}
