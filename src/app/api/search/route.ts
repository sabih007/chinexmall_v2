import { NextResponse } from "next/server";
import { getProducts } from "@/lib/repository";

/**
 * Instant-search endpoint used by the search overlay. Keeping search behind an
 * HTTP boundary means the client component does not change when the catalogue
 * moves to a real backend.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 24);

  if (q.trim().length < 2) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const { items, total } = await getProducts({
    search: q,
    sort: "featured",
    limit,
  });

  return NextResponse.json({
    items: items.map(({ id, slug, name, price, stock, thumbnail, shortDescription }) => ({ id, slug, name, price, stock, thumbnail, shortDescription })),
    total,
  });
}
