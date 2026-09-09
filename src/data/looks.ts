import { photo } from "@/lib/images";
import type { Look } from "@/lib/types";

/**
 * "Shop the look" lifestyle collections (spec §24). Each slot pins a product
 * to a hotspot on the lifestyle image, given as a percentage of width/height.
 */
export const looks: Look[] = [
  {
    id: "look_home",
    title: "Your home, your style",
    subtitle:
      "A living room reset built from five small pieces — nothing structural, everything noticeable.",
    image: photo("1493663284031-b7e3aefcae8e", 1600),
    slots: [
      { productSlug: "minimal-ceramic-vase", x: 30, y: 38 },
      { productSlug: "textured-glass-candle-holder", x: 62, y: 55 },
      { productSlug: "woven-wall-basket", x: 78, y: 26 },
      { productSlug: "marble-effect-trinket-tray", x: 46, y: 72 },
    ],
  },
  {
    id: "look_desk",
    title: "The five-minute desk reset",
    subtitle:
      "Lift the screen, hide the cables, clear the surface. The same desk, an hour of your day back.",
    image: photo("1544787219-7f47ccb76574", 1600),
    slots: [
      { productSlug: "aluminium-laptop-stand", x: 40, y: 42 },
      { productSlug: "leather-desk-mat", x: 58, y: 70 },
      { productSlug: "desk-organiser-tray", x: 74, y: 52 },
      { productSlug: "cable-management-box", x: 22, y: 66 },
    ],
  },
  {
    id: "look_kitchen",
    title: "A kitchen that stays tidy",
    subtitle:
      "Decant, divide and label once — then the counter looks after itself.",
    image: photo("1556909212-d5b604d0c90d", 1600),
    slots: [
      { productSlug: "stackable-glass-storage-jars", x: 34, y: 45 },
      { productSlug: "rotating-spice-carousel", x: 66, y: 38 },
      { productSlug: "bamboo-utensil-organiser", x: 52, y: 74 },
      { productSlug: "matte-ceramic-mug-set", x: 80, y: 62 },
    ],
  },
];

/** Social wall imagery (spec §39). */
export const socialPosts = [
  { image: photo("1513506003901-1e6a229e2d15", 700), caption: "Console styling, three pieces deep" },
  { image: photo("1584589167171-541ce45f1eea", 700), caption: "Pantry day" },
  { image: photo("1544787219-7f47ccb76574", 700), caption: "Desk reset" },
  { image: photo("1620916566398-39f1143ab7be", 700), caption: "Bathroom shelf, decanted" },
  { image: photo("1522708323590-d24dbb6b0267", 700), caption: "Baskets everywhere" },
  { image: photo("1602143407151-7111542de6e8", 700), caption: "Candle hour" },
  { image: photo("1556910103-1c02745aae4d", 700), caption: "Drawer, finally" },
  { image: photo("1549465220-1a8b9238cd48", 700), caption: "Gifting season" },
];
