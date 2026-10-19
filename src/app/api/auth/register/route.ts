import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";
import { registerCustomer } from "@/services/auth.service";

export const POST = handler(async (req: NextRequest) => {
  await rateLimit("register", 5, 15 * 60 * 1000);
  const input = await parseJson(req, registerSchema);
  return ok(await registerCustomer(input), { status: 201 });
});
