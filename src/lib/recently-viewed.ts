export const RECENTLY_VIEWED_KEY = "chinexmall:recently-viewed:v1";
const LIMIT = 12;
export function readRecentlyViewed(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is string => typeof item === "string" && item.length <= 200 && /^[a-z0-9-]+$/i.test(item)))].slice(0, LIMIT);
  } catch { return []; }
}
export function rememberProduct(history: string[], slug: string): string[] {
  return [slug, ...history.filter((item) => item !== slug)].slice(0, LIMIT);
}
