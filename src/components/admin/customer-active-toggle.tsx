"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { notifyError } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { GoldSwitch } from "./form-bits";

export function CustomerActiveToggle({
  customerId,
  name,
  isActive,
  canEdit,
}: {
  customerId: string;
  name: string;
  isActive: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function apply() {
    setSaving(true);
    try {
      await api(`/api/customers/${customerId}`, { method: "PUT", body: { isActive: !isActive } });
      toast.success(isActive ? `${name}'s account disabled` : `${name}'s account re-enabled`);
      setConfirming(false);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't update customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-medium text-charcoal">Account active</span>
          <span className="block text-xs text-stone">
            {isActive ? "Customer can sign in and order" : "Sign-in is blocked"}
          </span>
        </span>
        <GoldSwitch checked={isActive} disabled={!canEdit || saving} onCheckedChange={() => setConfirming(true)} />
      </label>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={apply}
        loading={saving}
        tone={isActive ? "danger" : "default"}
        confirmLabel={isActive ? "Disable account" : "Enable account"}
        title={isActive ? "Disable this account?" : "Re-enable this account?"}
        description={
          isActive
            ? `${name} will be signed out and won't be able to sign in or place orders until re-enabled.`
            : `${name} will be able to sign in and shop again.`
        }
      />
    </>
  );
}
