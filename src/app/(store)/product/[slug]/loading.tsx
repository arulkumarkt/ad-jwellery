import { Shimmer } from "@/components/common/skeletons";

export default function Loading() {
  return (
    <div className="container-lux grid gap-10 py-10 lg:grid-cols-[1.15fr_1fr]">
      <Shimmer className="aspect-[4/5] rounded-[1.75rem]" />
      <div className="space-y-5">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-12 w-4/5" />
        <Shimmer className="h-8 w-40" />
        <Shimmer className="h-20 w-full" />
        <Shimmer className="h-12 w-full rounded-full" />
        <Shimmer className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
