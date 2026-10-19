import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "./api";
import { env } from "./env";

export interface StoredImage {
  url: string;
  thumbnail: string;
}

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function assertImage(file: File): string {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new ApiError(`Unsupported file type: ${file.type || "unknown"}`, 415);
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError("Images must be 5 MB or smaller", 413);
  return ext;
}

/** Writes into /public/uploads. Suitable for a single VM; use a cloud provider on serverless hosts. */
async function storeLocal(file: File, ext: string): Promise<StoredImage> {
  const now = new Date();
  const rel = path.posix.join("uploads", String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const dir = path.join(process.cwd(), "public", rel);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  const url = `/${rel}/${name}`;
  return { url, thumbnail: url };
}

/** Signed upload to Cloudinary. IMAGE_STORAGE_API_KEY is "<api_key>:<api_secret>". */
async function storeCloudinary(file: File): Promise<StoredImage> {
  const [apiKey, apiSecret] = env.imageStorageApiKey.split(":");
  if (!env.imageStorageUrl || !apiKey || !apiSecret) {
    throw new ApiError("Cloud image storage is not configured", 503);
  }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "swarnika/products";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);
  const res = await fetch(env.imageStorageUrl, { method: "POST", body: form, cache: "no-store" });
  if (!res.ok) {
    console.error("[storage] upload failed", res.status, await res.text().catch(() => ""));
    throw new ApiError("Image upload failed", 502);
  }
  const data = (await res.json()) as { secure_url: string };
  const thumbnail = data.secure_url.replace("/upload/", "/upload/c_fill,w_480,h_600,q_auto,f_auto/");
  return { url: data.secure_url, thumbnail };
}

export async function storeImage(file: File): Promise<StoredImage> {
  const ext = assertImage(file);
  return env.imageProvider === "cloudinary" ? storeCloudinary(file) : storeLocal(file, ext);
}
