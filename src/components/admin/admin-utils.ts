import { toast } from "sonner";
import { ApiClientError } from "@/lib/fetcher";

export { adminInput, adminTextarea, adminSelect, cardClass } from "./admin-styles";

export { hasRole } from "./admin-roles";

/** Shows a friendly toast for any failed admin request. Returns per-field errors when present. */
export function notifyError(err: unknown, fallback = "Something went wrong"): Record<string, string> {
  if (err instanceof ApiClientError) {
    if (err.status === 403) {
      toast.error("You don't have permission for this action", {
        description: "Ask a store owner or manager to grant you access.",
      });
    } else if (err.status === 401) {
      toast.error("Your session has expired", { description: "Please sign in again." });
    } else {
      toast.error(err.message || fallback);
    }
    return err.fields ?? {};
  }
  toast.error(err instanceof Error ? err.message : fallback);
  return {};
}

/** Converts a "yyyy-mm-ddThh:mm" local value <-> ISO string. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function num(value: string, fallback = 0): number {
  const n = Number(value);
  return value.trim() === "" || !Number.isFinite(n) ? fallback : n;
}
