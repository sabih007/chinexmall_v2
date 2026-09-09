import type { Review } from "@/lib/types";

/**
 * PLACEHOLDER REVIEW DATA — for development only.
 *
 * Per spec §35, replace this with real, verified customer reviews before
 * launch (or wire the section to a reviews provider). The homepage renders a
 * "sample content" note while `PLACEHOLDER_REVIEWS` is true.
 */
export const PLACEHOLDER_REVIEWS = true;

export const reviews: Review[] = [
  {
    id: "rev_01",
    author: "Ayesha R.",
    location: "Lahore",
    rating: 5,
    title: "Better than the photos",
    body: "Ordered the ceramic vase on a whim and it has ended up being the nicest thing on my console table. The glaze looks expensive in person.",
    productSlug: "minimal-ceramic-vase",
    date: "2025-05-18",
    verified: true,
  },
  {
    id: "rev_02",
    author: "Hamza K.",
    location: "Karachi",
    rating: 5,
    title: "Finally, a tidy pantry",
    body: "The glass jars actually stack square, which sounds like a small thing until you have tried the cheap round ones. Bought a second set the next week.",
    productSlug: "stackable-glass-storage-jars",
    date: "2025-05-11",
    verified: true,
  },
  {
    id: "rev_03",
    author: "Nida S.",
    location: "Islamabad",
    rating: 5,
    title: "Desk feels twice as big",
    body: "Everything arrived brand new and sealed. The laptop stand is solid aluminium, not the flimsy kind, and it folds down for travel.",
    productSlug: "aluminium-laptop-stand",
    date: "2025-05-04",
    verified: true,
  },
  {
    id: "rev_04",
    author: "Bilal A.",
    location: "Rawalpindi",
    rating: 4,
    title: "Charges everything at once",
    body: "Three devices, one plug on the nightstand. The magnetic pad holds my phone at a good angle for the alarm. Cable could be a touch longer.",
    productSlug: "3-in-1-wireless-charging-stand",
    date: "2025-04-27",
    verified: true,
  },
  {
    id: "rev_05",
    author: "Fatima Z.",
    location: "Multan",
    rating: 5,
    title: "Gift-ready out of the box",
    body: "I bought the gift box for a housewarming and did not need to wrap anything. Presentation was genuinely lovely for the price.",
    productSlug: "home-ritual-gift-box",
    date: "2025-04-20",
    verified: true,
  },
  {
    id: "rev_06",
    author: "Usman T.",
    location: "Faisalabad",
    rating: 5,
    title: "Keeps ice all day",
    body: "Filled it at 8am, still had ice at 6pm in June. The powder coat has not chipped despite living in my car door.",
    productSlug: "insulated-stainless-bottle",
    date: "2025-04-12",
    verified: true,
  },
  {
    id: "rev_07",
    author: "Sana M.",
    location: "Lahore",
    rating: 5,
    title: "The light is perfect",
    body: "The warm setting on the vanity mirror is the closest to natural light I have found. Delivery took three days.",
    productSlug: "led-vanity-mirror",
    date: "2025-04-02",
    verified: true,
  },
  {
    id: "rev_08",
    author: "Zeeshan H.",
    location: "Peshawar",
    rating: 4,
    title: "Sorted the whole wardrobe",
    body: "One organiser per shelf and the cupboard finally makes sense. Dividers are firm and do not slide about.",
    productSlug: "modern-home-organizer",
    date: "2025-03-25",
    verified: true,
  },
];
