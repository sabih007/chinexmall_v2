/**
 * Single source of truth for everything the business will want to change
 * without touching a component: brand copy, announcements, navigation,
 * WhatsApp, socials, shipping thresholds and policy text.
 */

export const site = {
  name: "ChineXmall",
  shortName: "ChineXmall",
  legalName: "ChineXmall",
  tagline: "Smart products for everyday life",
  description:
    "Brand-new home, kitchen, lifestyle and gadget finds imported directly — thoughtfully selected and smartly priced.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  locale: "en_PK",
  currency: {
    code: "PKR",
    prefix: "Rs.",
  },
  /** Prefix on every order number, e.g. CX-7K3QD2. */
  orderPrefix: "CX",
  freeShippingThreshold: 3500,
  whatsapp: {
    /** International format, digits only. */
    number: "923001234567",
    display: "+92 300 123 4567",
  },
  email: "hello@example.com",
  phone: "+92 300 123 4567",
  address: "Main Boulevard, Gulberg III, Lahore, Pakistan",
  hours: "Mon – Sat, 10:00 – 19:00",
  /** Default shipping copy on a product page, unless a product overrides it. */
  shippingBlurb:
    "Dispatched within 24–48 hours. Nationwide delivery in 2–5 working days, with free delivery once your order passes the threshold shown in your cart.",
} as const;

/** Rotating announcement bar (spec §08). Add or remove freely. */
export const announcements: string[] = [
  `Free delivery on orders over ${site.currency.prefix} ${site.freeShippingThreshold.toLocaleString("en-PK")}`,
  "Every product is brand new — never used, never refurbished",
  "New stock landing every week",
  "Direct import · Smart prices",
];

export interface NavLink {
  label: string;
  href: string;
  /** Optional mega-menu column of child links. */
  children?: { label: string; href: string }[];
  emphasis?: boolean;
}

export const primaryNav: NavLink[] = [
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Best Sellers", href: "/best-sellers" },
      { label: "Deals", href: "/deals" },
    ],
  },
  {
    label: "Home",
    href: "/collections/home-decor",
    children: [
      { label: "Home Décor", href: "/collections/home-decor" },
      { label: "Organization", href: "/collections/organization" },
      { label: "Bathroom", href: "/collections/bathroom" },
      { label: "Cleaning", href: "/collections/cleaning" },
    ],
  },
  { label: "Kitchen", href: "/collections/kitchen" },
  {
    label: "Lifestyle",
    href: "/collections/lifestyle",
    children: [
      { label: "Lifestyle", href: "/collections/lifestyle" },
      { label: "Beauty & Care", href: "/collections/beauty-care" },
      { label: "Office & Desk", href: "/collections/office" },
      { label: "Kids", href: "/collections/kids" },
    ],
  },
  {
    label: "Gadgets",
    href: "/collections/gadgets",
    children: [
      { label: "Gadgets", href: "/collections/gadgets" },
      { label: "Mobile Accessories", href: "/collections/mobile-accessories" },
      { label: "Car Accessories", href: "/collections/car" },
    ],
  },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Deals", href: "/deals", emphasis: true },
];

/** Feeds the header's "All categories" dropdown. */
export const categoryNav: { label: string; href: string }[] = [
  { label: "Home Décor", href: "/collections/home-decor" },
  { label: "Kitchen", href: "/collections/kitchen" },
  { label: "Organization", href: "/collections/organization" },
  { label: "Bathroom", href: "/collections/bathroom" },
  { label: "Cleaning", href: "/collections/cleaning" },
  { label: "Lifestyle", href: "/collections/lifestyle" },
  { label: "Beauty & Care", href: "/collections/beauty-care" },
  { label: "Office & Desk", href: "/collections/office" },
  { label: "Kids", href: "/collections/kids" },
  { label: "Gadgets", href: "/collections/gadgets" },
  { label: "Mobile Accessories", href: "/collections/mobile-accessories" },
  { label: "Car Accessories", href: "/collections/car" },
  { label: "Gifts", href: "/collections/gifts" },
];

export const footerNav: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Best Sellers", href: "/best-sellers" },
      { label: "Deals", href: "/deals" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Home Décor", href: "/collections/home-decor" },
      { label: "Kitchen", href: "/collections/kitchen" },
      { label: "Organization", href: "/collections/organization" },
      { label: "Lifestyle", href: "/collections/lifestyle" },
      { label: "Gadgets", href: "/collections/gadgets" },
      { label: "Gifts", href: "/collections/gifts" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns", href: "/policies/refund" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "Direct Import", href: "/our-story#direct-import" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

export const legalNav = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms", href: "/policies/terms" },
  { label: "Refund Policy", href: "/policies/refund" },
  { label: "Shipping Policy", href: "/policies/shipping" },
];

export const socials = [
  { label: "Instagram", href: "https://instagram.com", handle: "@chinexmall" },
  { label: "Facebook", href: "https://facebook.com", handle: "/chinexmall" },
  { label: "TikTok", href: "https://tiktok.com", handle: "@chinexmall" },
  { label: "YouTube", href: "https://youtube.com", handle: "@chinexmall" },
];

export const popularSearches = [
  "Home décor",
  "Kitchen",
  "Organizers",
  "Gadgets",
  "Gifts",
  "Storage",
];

/** Homepage "Why shop with us" (spec §22). */
export const valueProps = [
  {
    icon: "sparkles",
    title: "Brand new products",
    body: "Everything we sell is brand new. Never used, never refurbished.",
  },
  {
    icon: "ship",
    title: "Direct import",
    body: "Sourced straight from manufacturers, with no middlemen in between.",
  },
  {
    icon: "tag",
    title: "Smart prices",
    body: "Better sourcing means better prices — without cutting corners.",
  },
  {
    icon: "refresh",
    title: "New stock regularly",
    body: "Fresh, trending finds added to the store every single week.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Checkout configuration                                                    */
/*                                                                            */
/*  Rates, delivery windows and payment details the business will want to      */
/*  change without touching the checkout UI.                                   */
/* -------------------------------------------------------------------------- */

export interface DeliveryMethod {
  id: "standard" | "express";
  label: string;
  description: string;
  /** Quoted delivery window, reused on the confirmation page and in emails. */
  eta: string;
  fee: number;
  /** Waived once the basket passes `site.freeShippingThreshold`. */
  freeOverThreshold: boolean;
}

export const deliveryMethods: DeliveryMethod[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "Nationwide, dispatched within 24–48 hours.",
    eta: "2–5 working days",
    fee: 250,
    freeOverThreshold: true,
  },
  {
    id: "express",
    label: "Express delivery",
    description: "Priority handling for major cities.",
    eta: "1–2 working days",
    fee: 450,
    freeOverThreshold: false,
  },
];

export interface PaymentMethod {
  id: "cod" | "bank-transfer";
  label: string;
  description: string;
  /** Cash-handling charge. Set to 0 to absorb it. */
  fee: number;
}

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay the rider when your parcel arrives. Nothing upfront.",
    fee: 0,
  },
  {
    id: "bank-transfer",
    label: "Bank transfer",
    description:
      "Transfer the total and send us the receipt on WhatsApp. We dispatch the same day.",
    fee: 0,
  },
];

/** Shown on the confirmation page when the customer chooses bank transfer. */
export const bankAccount = {
  bank: "Meezan Bank",
  title: "ChineXmall",
  number: "0123 4567 8901 2345",
  iban: "PK00 MEZN 0000 0000 0000 0000",
} as const;

/** Pakistan's provinces and territories, for the delivery address. */
export const provinces = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;
