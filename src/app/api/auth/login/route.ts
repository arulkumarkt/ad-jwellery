import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import { loginCustomer } from "@/services/auth.service";

export const POST = handler(async (req: NextRequest) => {
  await rateLimit("login", 10, 15 * 60 * 1000);
  const input = await parseJson(req, loginSchema);
  return ok(await loginCustomer(input));
});
