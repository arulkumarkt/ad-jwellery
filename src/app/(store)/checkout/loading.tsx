import { CheckoutSkeleton } from "@/components/checkout/checkout-flow";
import { Shimmer } from "@/components/common/skeletons";

export default function CheckoutLoading() {
  return (
    <div className="container-lux pb-16 pt-6 sm:pt-10">
      <div className="mb-10 flex flex-col items-center gap-3">
        <Shimmer className="h-3 w-32" />
        <Shimmer className="h-10 w-48" />
      </div>
      <CheckoutSkeleton />
    </div>
  );
}
