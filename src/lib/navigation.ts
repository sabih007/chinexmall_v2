import "server-only";
import { cache } from "react";
import { getCatalogue, getCategories } from "./repository";

/** Shared by category tiles and every storefront menu. */
export const getShopCategories = cache(async () => {
  const [categories, products] = await Promise.all([getCategories(), getCatalogue()]);
  return categories.flatMap((category) => {
    const items = products.filter((product) => product.category === category.slug);
    if (!items.length) return [];
    return [{
      id: category.id,
      label: category.name,
      href: `/collections/${category.slug}`,
      image: items.find((product) => product.stock > 0)?.thumbnail || items[0].thumbnail || category.image,
      count: items.length,
    }];
  });
});

export type ShopCategory = Awaited<ReturnType<typeof getShopCategories>>[number];

export const shopLinks = [
  { label: "Home", href: "/" },
  { label: "Shop all", href: "/shop" },
  { label: "Best sellers", href: "/best-sellers" },
  { label: "New arrivals", href: "/new-arrivals" },
  { label: "Deals", href: "/deals" },
];
