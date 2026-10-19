import type { ZodError } from "zod";
import { ApiClientError } from "@/lib/fetcher";

export type FieldErrors = Record<string, string>;

/** Flattens zod issues into `{ "dotted.path": message }` (first message wins). */
export function zodFieldErrors(error: ZodError, prefix = ""): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = prefix + issue.path.map(String).join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Field errors returned by the API, if any. */
export function serverFieldErrors(err: unknown): FieldErrors {
  return err instanceof ApiClientError && err.fields ? err.fields : {};
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(value: string | string[] | undefined | null): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return null;
  return v;
}
