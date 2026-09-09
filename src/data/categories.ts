import { photo } from "@/lib/images";
import type { Category } from "@/lib/types";

/**
 * Categories are data, not code. Add, reorder or unfeature them here — the
 * navigation, homepage grid, filters and sitemap all read from this list.
 */
export const categories: Category[] = [
  {
    id: "cat_home_decor",
    name: "Home Décor",
    slug: "home-decor",
    tagline: "Small details that make a space feel like home",
    description:
      "Vases, frames, candles and quiet decorative pieces that give a room its personality — chosen for shape, finish and the way they sit in real light.",
    image: photo("1513506003901-1e6a229e2d15", 900),
    heroImage: photo("1513506003901-1e6a229e2d15", 1800),
    featured: true,
    order: 1,
  },
  {
    id: "cat_kitchen",
    name: "Kitchen & Dining",
    slug: "kitchen",
    tagline: "Everyday tools that earn their counter space",
    description:
      "Prep, cook, serve and store. Practical kitchen pieces with a clean finish, built for daily use rather than the back of a drawer.",
    image: photo("1556909212-d5b604d0c90d", 900),
    heroImage: photo("1556909212-d5b604d0c90d", 1800),
    featured: true,
    order: 2,
  },
  {
    id: "cat_organization",
    name: "Organization",
    slug: "organization",
    tagline: "A place for everything, finally",
    description:
      "Baskets, dividers, stackable boxes and drawer systems that turn cluttered corners into something you are happy to open.",
    image: photo("1584622650111-993a426fbf0a", 900),
    heroImage: photo("1584622650111-993a426fbf0a", 1800),
    featured: true,
    order: 3,
  },
  {
    id: "cat_beauty_care",
    name: "Beauty & Care",
    slug: "beauty-care",
    tagline: "Quiet luxuries for the daily routine",
    description:
      "Grooming tools, mirrors, brushes and personal-care accessories that make an ordinary morning feel a little more considered.",
    image: photo("1596462502278-27bfdc403348", 900),
    heroImage: photo("1596462502278-27bfdc403348", 1800),
    featured: true,
    order: 4,
  },
  {
    id: "cat_gadgets",
    name: "Gadgets",
    slug: "gadgets",
    tagline: "Small tech that actually gets used",
    description:
      "Chargers, lights, audio and clever little devices. Useful over flashy — the kind of thing you reach for without thinking.",
    image: photo("1618221195710-dd6b41faaea6", 900),
    heroImage: photo("1618221195710-dd6b41faaea6", 1800),
    featured: true,
    order: 5,
  },
  {
    id: "cat_lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    tagline: "The things that make a day run better",
    description:
      "Bottles, bags, travel pieces and everyday carry. Designed to be lived with, not looked after.",
    image: photo("1523275335684-37898b6baf30", 900),
    heroImage: photo("1523275335684-37898b6baf30", 1800),
    featured: true,
    order: 6,
  },
  {
    id: "cat_gifts",
    name: "Gifts",
    slug: "gifts",
    tagline: "Something they didn't know they wanted",
    description:
      "Giftable finds across every category — presentable straight out of the box, at prices that let you give more than one.",
    image: photo("1549465220-1a8b9238cd48", 900),
    heroImage: photo("1549465220-1a8b9238cd48", 1800),
    featured: true,
    order: 7,
  },
  {
    id: "cat_office",
    name: "Office & Desk",
    slug: "office",
    tagline: "A desk worth sitting at",
    description:
      "Organisers, stands, lighting and stationery that clear the surface and keep the working day tidy.",
    image: photo("1544787219-7f47ccb76574", 900),
    heroImage: photo("1544787219-7f47ccb76574", 1800),
    featured: true,
    order: 8,
  },
  {
    id: "cat_bathroom",
    name: "Bathroom",
    slug: "bathroom",
    tagline: "Calm, clean and uncluttered",
    description:
      "Dispensers, holders, mats and storage that bring a hotel-quiet order to the smallest room in the house.",
    image: photo("1620916566398-39f1143ab7be", 900),
    heroImage: photo("1620916566398-39f1143ab7be", 1800),
    featured: false,
    order: 9,
  },
  {
    id: "cat_cleaning",
    name: "Cleaning",
    slug: "cleaning",
    tagline: "Tools that make the job quicker",
    description:
      "Well-made cleaning essentials — the sort you leave out because they look fine on a shelf.",
    image: photo("1610701596007-11502861dcfa", 900),
    heroImage: photo("1610701596007-11502861dcfa", 1800),
    featured: false,
    order: 10,
  },
  {
    id: "cat_mobile",
    name: "Mobile Accessories",
    slug: "mobile-accessories",
    tagline: "Everyday phone essentials",
    description:
      "Cables, stands, mounts and power. Simple, dependable accessories in finishes that don't shout.",
    image: photo("1601784551446-20c9e07cdbdb", 900),
    heroImage: photo("1601784551446-20c9e07cdbdb", 1800),
    featured: false,
    order: 11,
  },
  {
    id: "cat_car",
    name: "Car Accessories",
    slug: "car",
    tagline: "Order on the road",
    description:
      "Mounts, organisers and small comforts that make the daily commute noticeably better.",
    image: photo("1552321554-5fefe8c9ef14", 900),
    heroImage: photo("1552321554-5fefe8c9ef14", 1800),
    featured: false,
    order: 12,
  },
  {
    id: "cat_kids",
    name: "Kids",
    slug: "kids",
    tagline: "Playful, practical, parent-approved",
    description:
      "Storage, mealtime and play pieces that survive real children and still look good in a shared room.",
    image: photo("1519710164239-da123dc03ef4", 900),
    heroImage: photo("1519710164239-da123dc03ef4", 1800),
    featured: false,
    order: 13,
  },
];
