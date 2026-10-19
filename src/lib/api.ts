import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import mongoose from "mongoose";
import type { ApiFailure, ApiSuccess } from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json<ApiFailure>({ ok: false, error: { message, ...(fields ? { fields } : {}) } }, { status });
}

export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function isDuplicateKey(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/** Converts any thrown error into a consistent JSON error response. */
export function toErrorResponse(err: unknown) {
  if (err instanceof ApiError) return fail(err.message, err.status, err.fields);
  if (err instanceof ZodError) return fail("Please check the highlighted fields", 422, zodFields(err));
  if (isDuplicateKey(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    return fail(`That ${field} is already in use`, 409, { [field]: "Already in use" });
  }
  if (err instanceof mongoose.Error.CastError) return fail("Invalid identifier", 400);
  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return fail("Please check the highlighted fields", 422, fields);
  }
  console.error("[api] unhandled error", err);
  return fail("Something went wrong. Please try again.", 500);
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Blocks cross-site form posts for cookie-authenticated mutations. */
function assertSameOrigin(req: NextRequest) {
  if (!MUTATING.has(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new ApiError("Cross-origin request blocked", 403);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Invalid origin", 403);
  }
}

/** Wraps a Route Handler with origin checks and uniform error handling. */
export function handler<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }
  return schema.parse(body);
}

export function assertObjectId(id: string, label = "id"): string {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(`Invalid ${label}`, 400);
  return id;
}

export function searchParamsObject(req: NextRequest): Record<string, string> {
  return Object.fromEntries(req.nextUrl.searchParams.entries());
}
