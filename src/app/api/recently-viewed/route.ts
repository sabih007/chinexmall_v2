import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/repository";

export async function GET(request: Request) {
  const slugs = [...new Set(new URL(request.url).searchParams.getAll("slug"))].filter((slug) => slug.length <= 200).slice(0, 5);
  if (!slugs.length) return NextResponse.json({ items: [] });
  const products = new Map((await getCatalogue()).map((product) => [product.slug, product]));
  const items = slugs.flatMap((slug) => { const product = products.get(slug); return product ? [product] : []; });
  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}
