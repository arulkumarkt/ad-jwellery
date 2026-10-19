import type { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { storeImage, type StoredImage } from "@/lib/storage";

/** POST /api/upload — admin multipart upload (`files` field, up to 10 images). */
export const POST = handler(async (req: NextRequest) => {
  await requireAdmin("staff");
  const form = await req.formData().catch(() => {
    throw new ApiError("Expected multipart/form-data", 400);
  });
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new ApiError("No files received", 400);
  if (files.length > 10) throw new ApiError("Upload at most 10 images at once", 400);
  const stored: StoredImage[] = [];
  for (const file of files) stored.push(await storeImage(file));
  return ok(stored, { status: 201 });
});
