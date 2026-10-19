"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { api, errorMessage } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

export function useLogout() {
  const router = useRouter();
  const { setCustomer } = useStore();
  const [pending, setPending] = useState(false);
  const logout = async () => {
    setPending(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      setCustomer(null);
      toast("You have been signed out");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not sign out"));
      setPending(false);
    }
  };
  return { logout, pending };
}

export function LogoutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  const { logout, pending } = useLogout();
  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-stone transition hover:text-destructive disabled:opacity-60",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {label}
    </button>
  );
}
