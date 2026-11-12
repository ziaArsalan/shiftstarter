import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

/** Sign a short-lived access JWT carrying the user id and role. */
export function signAccessToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

/** Verify an access JWT; throws if invalid/expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  return { sub: String(decoded.sub), role: decoded.role as Role };
}

/** Generate a 256-bit opaque refresh token (raw) and its SHA-256 hash (stored). */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Expiry Date for a newly issued refresh token, based on REFRESH_TTL_DAYS. */
export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}
