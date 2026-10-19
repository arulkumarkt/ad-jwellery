"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Loader2, MessageSquarePlus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RatingStars } from "@/components/common/rating-stars";
import { Reveal } from "@/components/motion";
import { useStore } from "@/components/providers/store-provider";
import { api, ApiClientError, errorMessage } from "@/lib/fetcher";
import { cn, formatDate } from "@/lib/utils";
import type { Paginated, ReviewDTO, ReviewSummaryDTO } from "@/types";

export function ReviewCard({ review }: { review: ReviewDTO }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-gold-50 font-display text-lg text-gold-700 ring-1 ring-gold-200">
            {review.name.charAt(0)}
          </span>
          <div>
            <p className="text-sm font-semibold">{review.name}</p>
            <p className="text-xs text-stone">
              {review.location ? `${review.location} · ` : ""}
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <RatingStars value={review.rating} size={13} />
      </div>
      {review.title && <h4 className="mt-4 font-sans text-[15px] font-semibold tracking-normal">{review.title}</h4>}
      <p className="mt-2 text-sm leading-relaxed text-stone">{review.comment}</p>
      {review.isVerifiedPurchase && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <BadgeCheck className="size-3.5" /> Verified purchase
        </p>
      )}
    </motion.article>
  );
}

function ReviewForm({ productId, onCreated }: { productId: string; onCreated: (r: ReviewDTO) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!rating) errs.rating = "Choose a rating";
    if (comment.trim().length < 10) errs.comment = "Tell us a little more (10+ characters)";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const r = await api<ReviewDTO>(`/api/products/${productId}/reviews`, { method: "POST", body: { rating, title, comment } });
      toast.success("Thank you for your review!");
      onCreated(r);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-gold-400 focus:ring-4 focus:ring-gold-100";
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={submit}
      className="overflow-hidden"
    >
      <div className="mt-6 space-y-4 rounded-3xl border border-gold-200 bg-gold-50/40 p-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone">Your rating</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                type="button"
                key={n}
                whileTap={{ scale: 0.8 }}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star className={cn("size-7 transition", (hover || rating) >= n ? "fill-gold-400 text-gold-400" : "text-gold-200")} strokeWidth={1.4} />
              </motion.button>
            ))}
          </div>
          {errors.rating && <p className="mt-1 text-xs text-destructive">{errors.rating}</p>}
        </div>
        <input className={input} placeholder="Review title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <div>
          <textarea className={cn(input, "min-h-28")} placeholder="How did it look and feel? How was the plating and finish?" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          {errors.comment && <p className="mt-1 text-xs text-destructive">{errors.comment}</p>}
        </div>
        <button disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-medium text-ivory disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />} Submit review
        </button>
      </div>
    </motion.form>
  );
}

export function ReviewsSection({
  productId,
  productSlug,
  initial,
  summary,
}: {
  productId: string;
  productSlug: string;
  initial: Paginated<ReviewDTO>;
  summary: ReviewSummaryDTO;
}) {
  const { customer } = useStore();
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const hasMore = page < initial.totalPages;

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await api<{ reviews: Paginated<ReviewDTO> }>(`/api/products/${productId}/reviews?page=${page + 1}`);
      setItems((prev) => [...prev, ...res.reviews.items]);
      setPage(res.reviews.page);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-border py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 text-4xl">Loved by our customers</h2>
          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-6xl leading-none">{summary.average ? summary.average.toFixed(1) : "–"}</span>
            <div className="pb-1">
              <RatingStars value={summary.average} size={16} />
              <p className="mt-1 text-xs text-stone">Based on {summary.count} review{summary.count === 1 ? "" : "s"}</p>
            </div>
          </div>
          <ul className="mt-6 space-y-2">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const count = summary.distribution[n];
              const pct = summary.count ? (count / summary.count) * 100 : 0;
              return (
                <li key={n} className="flex items-center gap-3 text-xs">
                  <span className="w-3 text-stone">{n}</span>
                  <Star className="size-3 fill-gold-400 text-gold-400" />
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand/70">
                    <motion.span
                      className="bg-gold-gradient block h-full rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: (5 - n) * 0.08 }}
                    />
                  </span>
                  <span className="w-6 text-right text-stone">{count}</span>
                </li>
              );
            })}
          </ul>
          {customer ? (
            <button
              onClick={() => setWriting((w) => !w)}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-charcoal px-6 text-sm font-medium transition hover:bg-charcoal hover:text-ivory"
            >
              <MessageSquarePlus className="size-4" /> {writing ? "Cancel" : "Write a review"}
            </button>
          ) : (
            <Link
              href={`/login?next=/product/${productSlug}%23reviews`}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-charcoal px-6 text-sm font-medium transition hover:bg-charcoal hover:text-ivory"
            >
              <MessageSquarePlus className="size-4" /> Sign in to review
            </Link>
          )}
          <AnimatePresence>
            {writing && (
              <ReviewForm
                productId={productId}
                onCreated={(r) => {
                  setItems((prev) => [r, ...prev]);
                  setWriting(false);
                }}
              />
            )}
          </AnimatePresence>
        </Reveal>

        <div>
          {items.length === 0 ? (
            <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border p-12 text-center">
              <div>
                <p className="font-display text-2xl">No reviews yet</p>
                <p className="mt-2 text-sm text-stone">Bought this piece? Share how it looked on you.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          )}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button onClick={loadMore} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium hover:border-gold-300">
                {loading && <Loader2 className="size-4 animate-spin" />} Load more reviews
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
