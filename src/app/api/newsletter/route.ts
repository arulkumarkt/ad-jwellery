import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validators";
import { Subscriber } from "@/models";

export const POST = handler(async (req: NextRequest) => {
  await rateLimit("newsletter", 5, 10 * 60 * 1000);
  const { email, source } = await parseJson(req, newsletterSchema);
  await connectDB();
  await Subscriber.updateOne({ email }, { $setOnInsert: { email, source: source || "footer" } }, { upsert: true });
  return ok({ subscribed: true });
});
