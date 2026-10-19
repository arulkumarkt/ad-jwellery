"use client";

import { useRef, useState, type DragEvent } from "react";
import { Link2, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { uploadImages } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { AdminImage } from "./admin-image";
import { notifyError } from "./admin-utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

function isValidImageUrl(v: string) {
  return v.startsWith("/") || /^https?:\/\//.test(v);
}

/** Drop zone that uploads files and/or accepts a pasted URL. */
export function ImageUploader({
  onAdd,
  multiple = true,
  compact,
  label = "Drop images here or click to upload",
  className,
}: {
  onAdd: (images: { url: string; thumbnail: string }[]) => void;
  multiple?: boolean;
  compact?: boolean;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState("");

  async function handleFiles(list: FileList | File[] | null) {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const batch = multiple ? files.slice(0, 10) : files.slice(0, 1);
    setUploading(true);
    try {
      const uploaded = await uploadImages(batch);
      onAdd(uploaded);
      toast.success(uploaded.length > 1 ? `${uploaded.length} images uploaded` : "Image uploaded");
    } catch (err) {
      notifyError(err, "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  function addUrl() {
    const v = url.trim();
    if (!v) return;
    if (!isValidImageUrl(v)) {
      toast.error("Use a full https:// URL or a /path");
      return;
    }
    onAdd([{ url: v, thumbnail: v }]);
    setUrl("");
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center transition",
          compact ? "py-4" : "py-8",
          dragOver ? "border-gold-400 bg-gold-50" : "border-border bg-ivory/60 hover:border-gold-300 hover:bg-gold-50/50",
          uploading && "cursor-wait opacity-70",
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-white text-gold-600 shadow-soft ring-1 ring-gold-200">
          {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        </span>
        <span className="text-sm font-medium text-charcoal">{uploading ? "Uploading…" : label}</span>
        {!compact && <span className="text-xs text-stone">JPG, PNG, WebP, AVIF · up to 5 MB each</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste an image URL"
            className="h-9 w-full rounded-full border border-input bg-white pl-8 pr-3 text-xs outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-100"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          disabled={!url.trim()}
          className="h-9 rounded-full border border-border bg-white px-3.5 text-xs font-medium text-charcoal transition hover:border-gold-300 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/** Single-image field (category image, banner image, OG image, etc). */
export function SingleImageField({
  value,
  onChange,
  aspect = "aspect-[4/3]",
  invalid,
}: {
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
  invalid?: boolean;
}) {
  if (value) {
    return (
      <div className={cn("group relative overflow-hidden rounded-2xl border bg-cream", invalid ? "border-destructive" : "border-border", aspect)}>
        <AdminImage src={value} alt="" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-charcoal/70 via-transparent p-3 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="truncate text-[11px] text-ivory/80">{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-medium text-rose-700"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      </div>
    );
  }
  return (
    <ImageUploader
      multiple={false}
      compact
      label="Upload image"
      onAdd={(imgs) => imgs[0] && onChange(imgs[0].url)}
      className={invalid ? "[&>button]:border-destructive" : undefined}
    />
  );
}

