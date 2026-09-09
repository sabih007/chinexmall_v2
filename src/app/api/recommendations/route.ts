import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/repository";

/** Cross-sell suggestions for the cart drawer. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exclude = searchParams.getAll("exclude");
  const limit = Math.min(Number(searchParams.get("limit") ?? 4) || 4, 12);

  const items = await getRecommendations(exclude, limit);
  return NextResponse.json({ items });
}
