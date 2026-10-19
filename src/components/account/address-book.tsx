"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPinned, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { Modal } from "@/components/common/modal";
import { EASE } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/fetcher";
import type { AddressDTO } from "@/types";
import { AddressCard } from "./address-card";
import { AddressForm } from "./address-form";

function sortAddresses(list: AddressDTO[]) {
  return [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

export function AddressBook({ initial, customerName }: { initial: AddressDTO[]; customerName: string }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(() => sortAddresses(initial));
  const [editing, setEditing] = useState<AddressDTO | "new" | null>(null);
  const [deleting, setDeleting] = useState<AddressDTO | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [defaultPending, setDefaultPending] = useState<string | null>(null);

  const onSaved = (saved: AddressDTO) => {
    setAddresses((prev) => {
      const others = prev.filter((a) => a._id !== saved._id).map((a) => (saved.isDefault ? { ...a, isDefault: false } : a));
      const next = [saved, ...others];
      // The server makes the first address default automatically.
      if (!next.some((a) => a.isDefault) && next.length) next[0] = { ...next[0], isDefault: true };
      return sortAddresses(next);
    });
    setEditing(null);
    router.refresh();
  };

  async function makeDefault(a: AddressDTO) {
    setDefaultPending(a._id);
    try {
      const { _id, ...rest } = a;
      const saved = await api<AddressDTO>(`/api/account/addresses/${_id}`, { method: "PUT", body: { ...rest, isDefault: true } });
      setAddresses((prev) => sortAddresses(prev.map((x) => (x._id === saved._id ? saved : { ...x, isDefault: false }))));
      toast.success("Default address updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDefaultPending(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await api(`/api/account/addresses/${deleting._id}`, { method: "DELETE" });
      setAddresses((prev) => {
        const rest = prev.filter((a) => a._id !== deleting._id);
        if (deleting.isDefault && rest.length && !rest.some((a) => a.isDefault)) rest[0] = { ...rest[0], isDefault: true };
        return sortAddresses(rest);
      });
      toast("Address removed");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Address book</span>
          <h1 className="mt-2 text-3xl text-charcoal sm:text-4xl">Saved addresses</h1>
          <p className="mt-1 text-sm text-stone">Pick one at checkout in a single tap.</p>
        </div>
        {addresses.length > 0 && (
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add address
          </Button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gold-200 bg-card">
          <EmptyState
            icon={MapPinned}
            title="No saved addresses yet"
            description="Save your home or office address for a faster checkout."
            action={
              <Button size="xl" onClick={() => setEditing("new")}>
                <Plus className="size-4" /> Add your first address
              </Button>
            }
          />
        </div>
      ) : (
        <motion.ul layout className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <AnimatePresence initial={false}>
            {addresses.map((a, i) => (
              <motion.li
                key={a._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: i * 0.05 } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              >
                <AddressCard
                  address={a}
                  busy={defaultPending === a._id}
                  onEdit={() => setEditing(a)}
                  onDelete={() => setDeleting(a)}
                  onMakeDefault={() => makeDefault(a)}
                />
              </motion.li>
            ))}
            <motion.li key="add" layout>
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="group grid h-full min-h-48 w-full place-items-center rounded-3xl border border-dashed border-gold-300 bg-gold-50/40 p-6 text-center transition hover:border-gold-400 hover:bg-gold-50"
              >
                <span>
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-card text-gold-600 shadow-soft transition group-hover:scale-105">
                    <Plus className="size-5" />
                  </span>
                  <span className="mt-3 block text-sm font-medium text-charcoal">Add a new address</span>
                </span>
              </button>
            </motion.li>
          </AnimatePresence>
        </motion.ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add address" : "Edit address"} size="lg">
        <div className="p-6 sm:p-8">
          <span className="eyebrow">{editing === "new" ? "New address" : "Edit address"}</span>
          <h2 className="mb-6 mt-2 text-3xl text-charcoal">{editing === "new" ? "Where should we deliver?" : "Update address"}</h2>
          {editing !== null && (
            <AddressForm
              key={editing === "new" ? "new" : editing._id}
              address={editing === "new" ? null : editing}
              defaultName={customerName}
              onSaved={onSaved}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      </Modal>

      <Modal open={deleting !== null} onClose={() => !deletePending && setDeleting(null)} title="Remove address" size="sm">
        <div className="p-6 sm:p-8">
          <h2 className="pr-8 text-2xl text-charcoal">Remove this address?</h2>
          <p className="mt-2 text-sm text-stone">
            {deleting ? `${deleting.fullName}, ${deleting.line1}, ${deleting.city}` : ""} will be removed from your address book.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="xl" onClick={() => setDeleting(null)} disabled={deletePending}>
              Keep it
            </Button>
            <Button variant="destructive" size="xl" onClick={confirmDelete} disabled={deletePending}>
              {deletePending && <Loader2 className="size-4 animate-spin" />} Remove
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
