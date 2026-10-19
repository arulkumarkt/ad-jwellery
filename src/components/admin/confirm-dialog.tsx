"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "@/components/common/modal";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  tone = "danger",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} size="sm">
      <div className="p-6 sm:p-7">
        <div
          className={
            tone === "danger"
              ? "mb-4 grid size-12 place-items-center rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200"
              : "mb-4 grid size-12 place-items-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-gold-200"
          }
        >
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="font-display text-2xl text-charcoal">{title}</h2>
        {description && <div className="mt-2 text-sm leading-relaxed text-stone">{description}</div>}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={onConfirm}
            disabled={loading}
            className={tone === "danger" ? "bg-rose-700 text-white hover:bg-rose-800" : undefined}
          >
            {loading && <LoaderCircle className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
