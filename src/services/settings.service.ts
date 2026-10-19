import "server-only";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { TAGS, invalidate } from "@/lib/cache";
import { serializeSettings } from "@/lib/serializers";
import { Setting } from "@/models";
import type { SiteSettingsDTO } from "@/types";
import type { z } from "zod";
import type { settingsInputSchema } from "@/lib/validators";

export const getSettings = unstable_cache(
  async (): Promise<SiteSettingsDTO> => {
    await connectDB();
    const doc = await Setting.findOne({ key: "site" }).lean();
    return serializeSettings(doc);
  },
  ["site-settings"],
  { tags: [TAGS.settings], revalidate: 3600 },
);

export async function updateSettings(input: z.infer<typeof settingsInputSchema>): Promise<SiteSettingsDTO> {
  await connectDB();
  const doc = await Setting.findOneAndUpdate(
    { key: "site" },
    { $set: { ...input, key: "site" } },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean();
  invalidate(TAGS.settings, TAGS.home);
  return serializeSettings(doc);
}
