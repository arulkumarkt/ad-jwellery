import { Shimmer } from "@/components/common/skeletons";

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-9 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Shimmer key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Shimmer key={i} className="h-40 rounded-3xl" />
      ))}
    </div>
  );
}
