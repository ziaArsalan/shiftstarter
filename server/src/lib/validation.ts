import { z } from "zod";

/** A URL restricted to http(s); rejects javascript:, data:, etc. */
export function httpUrl(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .url("Enter a valid URL")
    .refine((v) => /^https?:\/\//i.test(v), "URL must start with http:// or https://");
}
