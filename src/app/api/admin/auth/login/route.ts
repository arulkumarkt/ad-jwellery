import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import { loginAdmin } from "@/services/auth.service";

export const POST = handler(async (req: NextRequest) => {
  await rateLimit("admin-login", 5, 15 * 60 * 1000);
  return ok(await loginAdmin(await parseJson(req, loginSchema)));
});
