# Premium Lifestyle Store

A Shopify-style storefront built to the *Premium Lifestyle Store — Website
Specification*. Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 ·
Framer Motion · Lucide.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

---

## What is where

```
src/
├── app/
│   ├── page.tsx                  Homepage (spec §11 running order)
│   ├── shop/                     Shop all + search results
│   ├── collections/[slug]/       Category pages
│   ├── product/[slug]/           Product detail (prerendered per product)
│   ├── new-arrivals/ best-sellers/ deals/
│   ├── cart/ wishlist/ account/
│   ├── checkout/                 Address, delivery and payment (COD · bank transfer)
│   ├── order/[number]/           Order confirmation
│   ├── faq/ our-story/ contact/ policies/[slug]/
│   ├── api/                      search · recommendations · newsletter · orders
│   ├── sitemap.ts robots.ts not-found.tsx
│
├── components/
│   ├── layout/                   AnnouncementBar · Header · MobileNav · BottomNav · Footer
│   ├── home/                     Hero · CategoryGrid · ProductSections · PromoBanner ·
│   │                             WhyShop · ImportStory · ShopTheLook · LookBoard ·
│   │                             Reviews · SocialSection · Newsletter
│   ├── products/                 ProductCard · ProductGrid · ProductGallery ·
│   │                             ProductDetail · ProductVariants · RelatedProducts
│   ├── collections/              CollectionHero · CollectionView · CollectionFilters
│   ├── cart/                     CartDrawer (+ CartItem, QuantityStepper, recommendations)
│   ├── checkout/                 Fields (form primitives) · OrderSummary
│   ├── search/                   SearchOverlay
│   ├── ui/                       Button · Badge · Drawer · Accordion · Primitives
│   ├── common/                   Reveal · Breadcrumbs · WhatsAppFloat
│   └── providers/                StoreProvider (cart + wishlist + overlay state)
│
├── data/                         products.ts · categories.ts · reviews.ts · looks.ts
└── lib/                          repository.ts · types.ts · site.ts · format.ts ·
                                  cart.ts · orders.ts · images.ts · whatsapp.ts ·
                                  utils.ts
```

---

## Things you will want to change first

| What | Where |
| --- | --- |
| Store name, tagline, address, email, phone | `src/lib/site.ts` |
| WhatsApp number | `src/lib/site.ts` → `site.whatsapp.number` |
| Announcement bar messages | `src/lib/site.ts` → `announcements` |
| Free-delivery threshold | `src/lib/site.ts` → `freeShippingThreshold` |
| Delivery rates and windows | `src/lib/site.ts` → `deliveryMethods` |
| Payment methods, cash-handling fee | `src/lib/site.ts` → `paymentMethods` |
| Bank transfer account details | `src/lib/site.ts` → `bankAccount` |
| Navigation and footer links | `src/lib/site.ts` |
| Colours, fonts, radii | `src/app/globals.css` (`@theme` block) |
| Products | `src/data/products.ts` |
| Categories | `src/data/categories.ts` |
| Canonical domain | `NEXT_PUBLIC_SITE_URL` env var |

### Placeholder content to replace before launch

- **Product photography.** Images are Unsplash placeholders resolved through
  `photo()` in `src/lib/images.ts`. Point that helper at your own CDN /
  Supabase bucket / Shopify CDN and the whole catalogue switches at once.
  `next.config.ts` already allows `cdn.shopify.com` and `*.supabase.co`.
- **Reviews.** `src/data/reviews.ts` is sample data and is flagged as such on
  the homepage. Set `PLACEHOLDER_REVIEWS = false` once real reviews exist and
  the notice disappears.
- **Delivery times and return window.** Currently 2–5 working days and 7 days.
  Used in `src/app/faq/page.tsx`, `src/app/policies/[slug]/page.tsx` and
  `DEFAULT_SHIPPING` in `src/data/products.ts`.
- **Policy copy.** Starter text, not legal advice — have it reviewed.
- **Bank account details.** `bankAccount` in `src/lib/site.ts` is dummy data
  and is shown to anyone who picks bank transfer at checkout. Replace it, or
  drop that entry from `paymentMethods` to offer cash on delivery only.
- **Delivery rates.** `deliveryMethods` currently quotes Rs. 250 standard and
  Rs. 450 express — set these to what your courier actually charges.

---

## Adding a backend

No component imports product data directly. Every read goes through
`src/lib/repository.ts`, and every function there is `async`. To move to
Supabase, the Shopify Storefront API or a custom admin backend, reimplement
that one file against the same signatures — pages and components do not change.

```ts
getProducts(query)          // filter / sort / paginate, returns { items, total }
getProductBySlug(slug)
getAllProductSlugs()        // drives generateStaticParams
getRelatedProducts(product)
getRecommendations(exclude) // cart drawer cross-sell
getCategories() / getCategoryBySlug() / getCategoryCounts()
getFacets(scope)            // filter panel values + counts
getReviews() / getReviewsForProduct()
getLooks() / getLookProducts() / getSocialPosts()
```

The `Product` shape in `src/lib/types.ts` matches the spec's data model
(§42) field for field, including the `featured` / `bestSeller` / `newArrival` /
`trending` flags an admin panel would toggle (§43).

Other integration seams:

- **Orders** — `src/app/api/orders/route.ts` validates the customer, re-prices
  the basket and returns a placed order. Persist it, decrement stock and send
  the confirmation at the marked `TODO`; the checkout UI needs no changes.
- **Payment gateway** — add an entry to `paymentMethods` in `src/lib/site.ts`
  and branch on it after the order is created. The two methods shipped
  (cash on delivery, bank transfer) need no gateway.
- **Newsletter** — `src/app/api/newsletter/route.ts` validates and
  acknowledges; forward the address to your provider at the marked `TODO`.
- **Accounts** — `src/app/account/page.tsx` is a placeholder.
- **Cart persistence** — `StoreProvider` writes to `localStorage`; swap that
  for a cart API and the hooks stay the same.

---

## Behaviour worth knowing

- **Filters live in the URL.** `/shop?category=kitchen&sale=true&sort=price-desc`
  is shareable, indexable and survives a refresh. `CollectionView` parses and
  validates them; unknown values are ignored rather than trusted.
- **Checkout never trusts the browser.** The page POSTs product ids, quantities
  and variant selections — no prices. `/api/orders` looks each product up,
  re-applies its variant price deltas, re-checks stock and computes the
  delivery fee itself, so an edited request cannot buy anything cheaply.
  `src/lib/orders.ts` holds the rules and is imported by both sides, so the
  errors shown while typing are the same ones the server enforces.
- **A placed order rides to the confirmation page in `sessionStorage`,** which
  is what lets `/order/[number]` work with no database. Replace `readOrder` in
  `OrderConfirmation.tsx` with a fetch by order number once orders persist —
  the page already handles the "not on this device" case.
- **Cart and wishlist are per-device** (`localStorage`), hydrated after mount.
  Components that depend on them check `hydrated` first to avoid a flash of
  wrong state.
- **Variant defaults** prefer the option value with no price adjustment, so the
  price on a product card always matches the price the product page opens on.
- **Motion is restrained** and fully disabled under
  `prefers-reduced-motion: reduce`.

---

## SEO

Dynamic metadata on every route, Open Graph and Twitter cards, canonical URLs,
`sitemap.xml` (products, collections and static pages), `robots.txt`, and
JSON-LD for `OnlineStore`, `Product` (with `NewCondition`, offers and reviews),
`BreadcrumbList` and `FAQPage`. `/cart`, `/wishlist`, `/account` and `/api` are
excluded from indexing.

## Performance

All product pages are prerendered at build time. Images go through
`next/image` with AVIF/WebP, explicit `sizes` and blur placeholders; only
above-the-fold images are marked `priority`. Fonts are self-hosted through
`next/font`. Client JavaScript is limited to the components that genuinely need
it — the homepage sections, grids and cards are server components apart from
the interactive card shell.
