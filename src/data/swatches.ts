/**
 * The store's colour vocabulary.
 *
 * Lives on its own so the admin colour picker and the shop's colour facets
 * read from one list — and so importing the palette does not drag the whole
 * seed catalogue into a client bundle.
 */
export const SWATCH = {
  white: "#F1F0EC",
  cream: "#EBE3D5",
  beige: "#D8CBB8",
  sand: "#C9B79C",
  oak: "#C29A6C",
  walnut: "#7A5334",
  sage: "#A7B4A0",
  olive: "#6E7355",
  terracotta: "#B8724F",
  grey: "#9B9B96",
  navy: "#2C3A4F",
  charcoal: "#3A3A38",
  black: "#1B1B1B",
  blush: "#E4C7C0",
  clear: "#E8EDF0",
  steel: "#B7BDC2",
} as const;

export type SwatchName = keyof typeof SWATCH;

export const swatchNames = Object.keys(SWATCH) as SwatchName[];
