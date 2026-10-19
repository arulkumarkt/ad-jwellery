"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLockBody } from "@/hooks/use-lock-body";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { ImageDTO } from "@/types";

/** PDP gallery: thumbnails, crossfading stage, cursor-follow zoom, swipe, and fullscreen lightbox. */
export function ProductGallery({ images, name }: { images: ImageDTO[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const list = images.length ? images : [{ url: "", alt: name, thumbnail: "", isMain: true }];
  const current = list[Math.min(index, list.length - 1)];

  // Variant switches replace the image set: start from the first image again.
  const key = list.map((i) => i.url).join("|");
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setIndex(0);
  }

  const go = (d: 1 | -1) => {
    setDir(d);
    setIndex((i) => (i + d + list.length) % list.length);
  };

  const onMove = (e: React.MouseEvent) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto lg:max-h-[640px] lg:w-20 lg:flex-col lg:overflow-y-auto">
          {list.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => {
                setDir(i > index ? 1 : -1);
                setIndex(i);
              }}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl bg-cream transition lg:w-full",
                i === index ? "ring-2 ring-charcoal ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100",
              )}
            >
              {img.thumbnail && <Image src={img.thumbnail} alt="" fill sizes="80px" className="object-cover" />}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1">
        <div
          ref={stage}
          className={cn("relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-cream", !reduce && "lg:cursor-zoom-in")}
          onMouseMove={reduce ? undefined : onMove}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={current.url + index}
              custom={dir}
              className="absolute inset-0"
              initial={{ opacity: 0, x: reduce ? 0 : dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : dir * -60 }}
              transition={{ duration: 0.55, ease: EASE }}
              drag={list.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
            >
              {current.url && (
                <Image
                  src={current.url}
                  alt={current.alt || name}
                  fill
                  priority={index === 0}
                  sizes="(min-width:1024px) 50vw, 100vw"
                  className="pointer-events-none object-cover transition-transform duration-200 ease-out"
                  style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                  draggable={false}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(true);
            }}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/85 shadow-sm backdrop-blur transition hover:bg-white"
            aria-label="Open fullscreen gallery"
          >
            <Expand className="size-4" />
          </button>

          {list.length > 1 && (
            <>
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
                {list.map((_, i) => (
                  <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-charcoal" : "w-1.5 bg-charcoal/30")} />
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 hover:bg-white lg:grid [div:hover>&]:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 opacity-0 shadow-sm backdrop-blur transition hover:bg-white lg:grid [div:hover>&]:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <Lightbox open={lightbox} onClose={() => setLightbox(false)} images={list} index={index} setIndex={setIndex} name={name} />
    </div>
  );
}

function Lightbox({
  open,
  onClose,
  images,
  index,
  setIndex,
  name,
}: {
  open: boolean;
  onClose: () => void;
  images: ImageDTO[];
  index: number;
  setIndex: (i: number) => void;
  name: string;
}) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, setIndex]);

  if (typeof document === "undefined") return null;
  const img = images[index];
  return createPortal(
    <AnimatePresence>
      {open && img && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-charcoal/95 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
        >
          <div className="flex items-center justify-between p-4 text-ivory">
            <span className="text-sm text-ivory/70">
              {index + 1} / {images.length}
            </span>
            <button onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-ivory/10" aria-label="Close gallery">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={img.url} className="absolute inset-4 sm:inset-10" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <Image src={img.url} alt={img.alt || name} fill sizes="100vw" className="object-contain" />
              </motion.div>
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button onClick={() => setIndex((index - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20" aria-label="Previous">
                  <ChevronLeft />
                </button>
                <button onClick={() => setIndex((index + 1) % images.length)} className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20" aria-label="Next">
                  <ChevronRight />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
