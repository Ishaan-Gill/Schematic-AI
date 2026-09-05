/**
 * Maps raw upload failures (DuckDB / Supabase internals, storage paths,
 * parser dumps) to plain-language messages safe for toasts.
 *
 * Validation errors produced by this codebase are already user-friendly
 * and pass through unchanged. Everything else becomes a generic message;
 * callers keep logging the raw error for observability.
 */
const FRIENDLY_PREFIXES = [
  "Empty file.",
  "File too large.",
  "Unsupported file type.",
  "This workbook contains no usable sheets.",
  "This file contains no usable data.",
  "This file appears to be empty.",
  "No columns detected in this file.",
  "Dataset too large.",
  "Too many columns.",
  "User not authenticated",
];

export function friendlyUploadError(error: unknown, fileName: string): string {
  if (error instanceof Error && error.message) {
    const message = error.message;
    if (FRIENDLY_PREFIXES.some((prefix) => message.startsWith(prefix))) {
      return message;
    }
  }

  return `Couldn't upload "${fileName}". Please check the file and try again.`;
}
