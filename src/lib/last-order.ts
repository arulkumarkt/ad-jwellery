import "server-only";
import { cookies } from "next/headers";

/** Lets a guest view the confirmation page of the order they just placed. */
const LAST_ORDER_COOKIE = "sw_last_order";

export async function rememberLastOrder(orderId: string) {
  (await cookies()).set(LAST_ORDER_COOKIE, orderId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function readLastOrder(): Promise<string | null> {
  return (await cookies()).get(LAST_ORDER_COOKIE)?.value ?? null;
}
