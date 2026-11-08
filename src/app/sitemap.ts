import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/repository";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: products }, categories] = await Promise.all([
    getProducts({}),
    getCategories(),
  ]);

  const url = (path: string) => `${site.url}${path}`;

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: url("/"), changeFrequency: "daily", priority: 1 },
      { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
      { url: url("/new-arrivals"), changeFrequency: "daily", priority: 0.9 },
      { url: url("/best-sellers"), changeFrequency: "weekly", priority: 0.8 },
      { url: url("/deals"), changeFrequency: "daily", priority: 0.8 },
      { url: url("/our-story"), changeFrequency: "monthly", priority: 0.5 },
      { url: url("/contact"), changeFrequency: "monthly", priority: 0.5 },
      { url: url("/faq"), changeFrequency: "monthly", priority: 0.5 },
      ...["privacy", "terms", "refund", "shipping"].map((slug) => ({
        url: url(`/policies/${slug}`),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
    ] satisfies MetadataRoute.Sitemap
  );

  return [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: url(`/collections/${c.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: url(`/product/${p.slug}`),
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
