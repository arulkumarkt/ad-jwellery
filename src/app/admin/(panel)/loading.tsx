import { Shimmer, TableSkeleton } from "@/components/common/skeletons";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-9 w-64" />
          <Shimmer className="h-3 w-80 max-w-full" />
        </div>
        <Shimmer className="hidden h-10 w-36 rounded-full sm:block" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
        <TableSkeleton rows={7} />
      </div>
    </div>
  );
}
