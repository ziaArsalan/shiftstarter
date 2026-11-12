import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "INTERNAL";

/**
 * Application error with an HTTP status and a stable machine-readable code.
 * `details` carries field-level validation info when relevant.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static unauthorized(message = "Authentication required") {
    return new AppError("UNAUTHORIZED", 401, message);
  }
  static forbidden(message = "You do not have access to this resource") {
    return new AppError("FORBIDDEN", 403, message);
  }
  static notFound(message = "Resource not found") {
    return new AppError("NOT_FOUND", 404, message);
  }
  static conflict(message = "Resource already exists") {
    return new AppError("CONFLICT", 409, message);
  }
  static validation(message = "Validation failed", details?: unknown) {
    return new AppError("VALIDATION_ERROR", 422, message, details);
  }
}

/** Express error handler — always responds `{ error: { code, message, details? } }`. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }

  console.error("[error]", err);
  return res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
}

/** Wrap an async route handler so rejected promises reach the error handler. */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
