/** Compact input styling for dense admin forms. */
export const adminInput =
  "h-10 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-charcoal outline-none transition placeholder:text-stone/60 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 aria-invalid:border-destructive aria-invalid:ring-destructive/10 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70";

export const adminTextarea =
  "min-h-24 w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm leading-relaxed text-charcoal outline-none transition placeholder:text-stone/60 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 aria-invalid:border-destructive disabled:opacity-70";

export const adminSelect = `${adminInput} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f675c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9`;

export const cardClass = "rounded-2xl border border-border bg-white shadow-soft";
