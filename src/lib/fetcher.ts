import type { ApiResult } from "@/types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Typed client for our JSON APIs. Throws ApiClientError with field errors on failure. */
export async function api<T>(
  url: string,
  opts: { method?: Method; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "same-origin",
    cache: "no-store",
  });
  let json: ApiResult<T> | null = null;
  try {
    json = (await res.json()) as ApiResult<T>;
  } catch {
    /* non-JSON */
  }
  if (!res.ok || !json || !json.ok) {
    const err = json && !json.ok ? json.error : null;
    throw new ApiClientError(err?.message ?? `Request failed (${res.status})`, res.status, err?.fields);
  }
  return json.data;
}

/** Uploads image files via multipart to /api/upload. */
export async function uploadImages(files: File[]): Promise<{ url: string; thumbnail: string }[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "same-origin" });
  const json = (await res.json().catch(() => null)) as ApiResult<{ url: string; thumbnail: string }[]> | null;
  if (!res.ok || !json || !json.ok) {
    throw new ApiClientError(json && !json.ok ? json.error.message : "Upload failed", res.status);
  }
  return json.data;
}

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  return err instanceof Error ? err.message : fallback;
}
