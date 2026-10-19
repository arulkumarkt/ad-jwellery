import type { AdminRole } from "@/types";

const ROLE_RANK: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 };

export function hasRole(role: AdminRole, min: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
