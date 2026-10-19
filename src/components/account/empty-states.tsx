"use client";

import { PackageSearch, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

/** Client wrappers so server pages can render EmptyState (which takes an icon component). */
export function NoOrdersState() {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="No orders yet"
      description="When you place an order it will appear here, with live tracking every step of the way."
      action={{ label: "Start shopping", href: "/products" }}
    />
  );
}

export function OrderNotFoundState() {
  return (
    <EmptyState
      icon={PackageSearch}
      title="We couldn't find that order"
      description="The link may have expired. Signed-in customers can find every order under My Orders."
      action={{ label: "Continue shopping", href: "/products" }}
    />
  );
}
