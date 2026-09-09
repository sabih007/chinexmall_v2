/**
 * Placeholder photography helper.
 *
 * Every image in the seed data goes through `photo()`, so switching to real
 * product photography is a one-file change: point this at your own CDN,
 * Supabase storage bucket or Shopify CDN and keep the same keys.
 */
export function photo(id: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;
}

/** Tiny neutral blur placeholder — avoids a flash of empty box on load. */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YwZWZlYiIvPjwvc3ZnPg==";
