import { ProductGridSkeleton, Shimmer } from "@/components/common/skeletons";

export default function Loading() {
  return (
    <div className="container-lux py-8">
      <Shimmer className="h-3 w-32" />
      <Shimmer className="mt-8 h-12 w-72" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">{[0, 1, 2, 3].map((i) => <Shimmer key={i} className="h-24" />)}</div>
        <ProductGridSkeleton count={9} className="md:grid-cols-3 lg:grid-cols-3" />
      </div>
    </div>
  );
}
