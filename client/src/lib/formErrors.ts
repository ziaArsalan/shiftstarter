import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";

/**
 * Map a server VALIDATION_ERROR (with field details) onto react-hook-form
 * fields. Returns a fallback message for anything not tied to a field.
 */
export function applyApiError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  knownFields: Array<keyof T>,
): string | null {
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";

  if (err.code === "VALIDATION_ERROR" && err.details?.length) {
    let unmapped: string | null = null;
    for (const detail of err.details) {
      const field = detail.path.split(".")[0];
      if (knownFields.includes(field as keyof T)) {
        setError(field as Path<T>, { type: "server", message: detail.message });
      } else {
        unmapped = detail.message;
      }
    }
    return unmapped;
  }
  return err.message;
}
