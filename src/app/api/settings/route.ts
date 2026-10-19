import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { settingsInputSchema } from "@/lib/validators";
import { getSettings, updateSettings } from "@/services/settings.service";

export const GET = handler(async () => ok(await getSettings()));

export const PUT = handler(async (req: NextRequest) => {
  await requireAdmin("owner");
  return ok(await updateSettings(await parseJson(req, settingsInputSchema)));
});
