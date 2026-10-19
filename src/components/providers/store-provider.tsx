"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/fetcher";
import type { CartDTO, SessionCustomer, WishlistDTO } from "@/types";

interface StoreContextValue {
  customer: SessionCustomer | null;
  setCustomer: (c: SessionCustomer | null) => void;

  cart: CartDTO | null;
  cartLoading: boolean;
  cartCount: number;
  refreshCart: () => Promise<void>;
  addToCart: (
    productId: string,
    variantId: string | null,
    quantity?: number,
    opts?: { openDrawer?: boolean; silent?: boolean },
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string | null) => Promise<boolean>;
  pendingItemIds: Set<string>;

  wishlistIds: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, name?: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;

  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children, initialCustomer }: { children: ReactNode; initialCustomer: SessionCustomer | null }) {
  const [customer, setCustomer] = useState<SessionCustomer | null>(initialCustomer);
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingItemIds, setPending] = useState<Set<string>>(new Set());
  const wishlistBusy = useRef(new Set<string>());

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api<CartDTO>("/api/cart"));
    } catch {
      /* keep previous cart */
    } finally {
      setCartLoading(false);
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    try {
      const w = await api<WishlistDTO>("/api/wishlist");
      setWishlistIds(new Set(w.productIds));
    } catch {
      /* ignore */
    }
  }, []);

  // Reload personal data whenever the signed-in identity changes (login merges guest data).
  useEffect(() => {
    let alive = true;
    api<CartDTO>("/api/cart")
      .then((c) => alive && setCart(c))
      .catch(() => {})
      .finally(() => alive && setCartLoading(false));
    api<WishlistDTO>("/api/wishlist")
      .then((w) => alive && setWishlistIds(new Set(w.productIds)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [customer?.id]);

  const markPending = (id: string, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const addToCart = useCallback<StoreContextValue["addToCart"]>(async (productId, variantId, quantity = 1, opts = {}) => {
    try {
      const next = await api<CartDTO>("/api/cart", { method: "POST", body: { productId, variantId, quantity } });
      setCart(next);
      if (opts.openDrawer !== false) setCartOpen(true);
      else if (!opts.silent) toast.success("Added to your bag");
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Could not add to bag"));
      return false;
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    markPending(itemId, true);
    // Optimistic quantity update for a snappy stepper.
    setCart((prev) =>
      prev ? { ...prev, items: prev.items.map((i) => (i._id === itemId ? { ...i, quantity, lineTotal: i.price * quantity } : i)) } : prev,
    );
    try {
      setCart(await api<CartDTO>("/api/cart", { method: "PUT", body: { itemId, quantity } }));
    } catch (err) {
      toast.error(errorMessage(err));
      await refreshCart();
    } finally {
      markPending(itemId, false);
    }
  }, [refreshCart]);

  const removeItem = useCallback(async (itemId: string) => {
    markPending(itemId, true);
    try {
      setCart(await api<CartDTO>(`/api/cart/${itemId}`, { method: "DELETE" }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      markPending(itemId, false);
    }
  }, []);

  const applyCoupon = useCallback(async (code: string | null) => {
    try {
      const next = await api<CartDTO>("/api/cart/coupon", { method: "POST", body: { code } });
      setCart(next);
      if (code) toast.success(`${code} applied`);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Invalid coupon"));
      return false;
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: string, name?: string) => {
    if (wishlistBusy.current.has(productId)) return;
    wishlistBusy.current.add(productId);
    let wasSaved = false;
    setWishlistIds((prev) => {
      wasSaved = prev.has(productId);
      const next = new Set(prev);
      if (wasSaved) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      const res = wasSaved
        ? await api<WishlistDTO>(`/api/wishlist/${productId}`, { method: "DELETE" })
        : await api<WishlistDTO>("/api/wishlist", { method: "POST", body: { productId } });
      setWishlistIds(new Set(res.productIds));
      toast(wasSaved ? "Removed from wishlist" : "Saved to wishlist", { description: name });
    } catch (err) {
      toast.error(errorMessage(err));
      await refreshWishlist();
    } finally {
      wishlistBusy.current.delete(productId);
    }
  }, [refreshWishlist]);

  const value = useMemo<StoreContextValue>(
    () => ({
      customer,
      setCustomer,
      cart,
      cartLoading,
      cartCount: cart?.itemCount ?? 0,
      refreshCart,
      addToCart,
      updateQuantity,
      removeItem,
      applyCoupon,
      pendingItemIds,
      wishlistIds,
      isWishlisted: (id) => wishlistIds.has(id),
      toggleWishlist,
      refreshWishlist,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
    }),
    [customer, cart, cartLoading, refreshCart, addToCart, updateQuantity, removeItem, applyCoupon, pendingItemIds, wishlistIds, toggleWishlist, refreshWishlist, cartOpen, searchOpen],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
