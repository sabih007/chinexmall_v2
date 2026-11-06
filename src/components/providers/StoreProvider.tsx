"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { defaultSelections, lineKey, resolveVariant } from "@/lib/cart";
import { trackAddToCart } from "@/lib/meta-pixel/pixel";
import type { CartLine, Product } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Cart + wishlist state                                                     */
/*                                                                            */
/*  Persisted to localStorage so a refresh does not lose a basket. When a real */
/*  backend arrives, swap the reducer's persistence for a cart API — the       */
/*  component-facing hooks stay identical.                                     */
/* -------------------------------------------------------------------------- */

const CART_KEY = "gh.cart.v1";
const WISHLIST_KEY = "gh.wishlist.v1";

interface State {
  lines: CartLine[];
  wishlist: string[];
  hydrated: boolean;
}

type Action =
  | { type: "hydrate"; lines: CartLine[]; wishlist: string[] }
  | { type: "add"; line: CartLine }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "toggleWish"; slug: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, lines: action.lines, wishlist: action.wishlist, hydrated: true };

    case "add": {
      const existing = state.lines.find((l) => l.key === action.line.key);
      if (!existing) return { ...state, lines: [...state.lines, action.line] };
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.key === action.line.key
            ? {
                ...l,
                quantity: Math.min(
                  l.quantity + action.line.quantity,
                  l.maxQuantity,
                ),
              }
            : l,
        ),
      };
    }

    case "setQuantity":
      return {
        ...state,
        lines: state.lines.flatMap((l) => {
          if (l.key !== action.key) return [l];
          const next = Math.min(Math.max(action.quantity, 0), l.maxQuantity);
          return next === 0 ? [] : [{ ...l, quantity: next }];
        }),
      };

    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.key !== action.key) };

    case "clear":
      return { ...state, lines: [] };

    case "toggleWish":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.slug)
          ? state.wishlist.filter((s) => s !== action.slug)
          : [action.slug, ...state.wishlist],
      };
  }
}

export interface AddToCartInput {
  product: Product;
  quantity?: number;
  selections?: Record<string, string>;
}

interface StoreValue {
  lines: CartLine[];
  wishlist: string[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  savings: number;
  addToCart: (input: AddToCartInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;

  /* UI surfaces */
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    lines: [],
    wishlist: [],
    hydrated: false,
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ---- hydrate from localStorage once on mount ---- */
  useEffect(() => {
    let lines: CartLine[] = [];
    let wishlist: string[] = [];
    try {
      const rawCart = window.localStorage.getItem(CART_KEY);
      if (rawCart) lines = JSON.parse(rawCart) as CartLine[];
      const rawWish = window.localStorage.getItem(WISHLIST_KEY);
      if (rawWish) wishlist = JSON.parse(rawWish) as string[];
    } catch {
      /* corrupt or unavailable storage — start empty */
    }
    dispatch({ type: "hydrate", lines, wishlist });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(state.lines));
    } catch {
      /* quota or private mode — cart still works for this session */
    }
  }, [state.lines, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.wishlist));
    } catch {
      /* ignore */
    }
  }, [state.wishlist, state.hydrated]);

  /* ---- lock body scroll while any overlay is open ---- */
  const anyOverlayOpen = cartOpen || searchOpen || menuOpen;
  useEffect(() => {
    if (!anyOverlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [anyOverlayOpen]);

  /* ---- close overlays on Escape ---- */
  useEffect(() => {
    if (!anyOverlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setCartOpen(false);
      setSearchOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyOverlayOpen]);

  const addToCart = useCallback(
    ({ product, quantity = 1, selections }: AddToCartInput) => {
      const chosen = selections ?? defaultSelections(product);
      const { unitPrice, compareAtPrice, imageIndex, variantLabel } =
        resolveVariant(product, chosen);

      const line: CartLine = {
        key: lineKey(product.id, chosen),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[imageIndex] ?? product.thumbnail,
        unitPrice,
        compareAtPrice,
        quantity,
        selections: chosen,
        variantLabel,
        maxQuantity: Math.max(product.stock, 1),
      };

      dispatch({ type: "add", line });

      /* Every "add to cart" in the store funnels through here — the product
         page, a card, the cart's recommendations, the look board — so this is
         the one place the event has to be reported from. It cannot throw. */
      trackAddToCart(line, product.category);

      setMenuOpen(false);
      setSearchOpen(false);
      setCartOpen(true);
    },
    [],
  );

  const value = useMemo<StoreValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = state.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
    const savings = state.lines.reduce(
      (n, l) =>
        n +
        Math.max((l.compareAtPrice ?? l.unitPrice) - l.unitPrice, 0) * l.quantity,
      0,
    );

    return {
      lines: state.lines,
      wishlist: state.wishlist,
      hydrated: state.hydrated,
      count,
      subtotal,
      savings,
      addToCart,
      setQuantity: (key, quantity) => dispatch({ type: "setQuantity", key, quantity }),
      removeLine: (key) => dispatch({ type: "remove", key }),
      clearCart: () => dispatch({ type: "clear" }),
      toggleWishlist: (slug) => dispatch({ type: "toggleWish", slug }),
      isWishlisted: (slug) => state.wishlist.includes(slug),

      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
      menuOpen,
      openMenu: () => setMenuOpen(true),
      closeMenu: () => setMenuOpen(false),
    };
  }, [state, cartOpen, searchOpen, menuOpen, addToCart]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
