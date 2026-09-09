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
├── proxy.ts                      Keeps signed-out visitors off /admin
├── app/
│   ├── layout.tsx                Document shell only — fonts, metadata, JSON-LD
│   ├── (storefront)/             Everything a shopper sees (adds no URL segment)
│   │   ├── page.tsx              Homepage (spec §11 running order)
│   │   ├── shop/                 Shop all + search results
│   │   ├── collections/[slug]/   Category pages
│   │   ├── product/[slug]/       Product detail (prerendered per product)
│   │   ├── new-arrivals/ best-sellers/ deals/
│   │   ├── cart/ wishlist/ account/
│   │   ├── checkout/             Address, delivery and payment (COD · bank transfer)
│   │   ├── order/[number]/       Order confirmation
│   │   └── faq/ our-story/ contact/ policies/[slug]/
│   ├── admin/                    Store dashboard — login, overview, products,
│   │   │                         coupons
│   │   ├── actions.ts            Server Actions: sign in, save, delete, restore
│   │   ├── login/
│   │   └── (dashboard)/          Signed-in pages, behind the sidebar chrome
│   ├── api/                      search · recommendations · newsletter ·
│   │                             orders · coupons
│   ├── sitemap.ts robots.ts not-found.tsx
│
├── components/
│   ├── admin/                    AdminNav · Fields · ProductForm ·
│   │                             ImageManager · CouponForm · CategoryForm ·
│   │                             TagRow · SwatchRow · ConfirmSubmit
│   ├── layout/                   AnnouncementBar · Header · MobileNav · BottomNav ·
│   │                             Footer · StorefrontShell
│   ├── home/                     Hero · CategoryGrid · ProductSections · PromoBanner ·
│   │                             WhyShop · ImportStory · ShopTheLook · LookBoard ·
│   │                             Reviews · SocialSection · Newsletter
│   ├── products/                 ProductCard · ProductGrid · ProductGallery ·
│   │                             ProductDetail · ProductVariants · RelatedProducts
│   ├── collections/              CollectionHero · CollectionView · CollectionFilters
│   ├── cart/                     CartDrawer (+ CartItem, QuantityStepper, recommendations)
│   ├── checkout/                 Fields (form primitives) · OrderSummary ·
│   │                             CouponField
│   ├── search/                   SearchOverlay
│   ├── ui/                       Button · Badge · Drawer · Accordion · Primitives
│   ├── common/                   Reveal · Breadcrumbs · WhatsAppFloat
│   └── providers/                StoreProvider (cart + wishlist + overlay state)
│
├── data/                         Seed catalogue — the dashboard overlays it:
│                                 products.ts · categories.ts · swatches.ts ·
│                                 reviews.ts · looks.ts
└── lib/                          repository.ts · types.ts · site.ts · format.ts ·
    │                             cart.ts · orders.ts · coupons.ts · pricing.ts ·
    │                             images.ts · whatsapp.ts · utils.ts
    └── admin/                    auth.ts · session.ts · json-store.ts ·
                                  store.ts · taxonomy-store.ts ·
                                  coupons-store.ts · product-form.ts ·
                                  category-form.ts · coupon-form.ts ·
                                  uploads.ts · form-state.ts
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
| Logo artwork | `public/logo.png`, `public/logo-white.png`, `public/logo-mark.png` — rendered by `src/components/layout/Logo.tsx` |
| Favicon, app icon, share image | `src/app/favicon.ico`, `icon.png`, `apple-icon.png`, `opengraph-image.png` |
| Products | The `/admin` dashboard, or `src/data/products.ts` for the seed |
| Categories, tags, colours | The `/admin` dashboard, or `src/data/` for the seed |
| Canonical domain | `NEXT_PUBLIC_SITE_URL` env var |
| Dashboard password | `ADMIN_PASSWORD` env var — see [The dashboard](#the-dashboard) |

### Placeholder content to replace before launch

- **Product photography.** Images are Unsplash placeholders resolved through
  `photo()` in `src/lib/images.ts`. Point that helper at your own CDN /
  Supabase bucket / Shopify CDN and the whole catalogue switches at once.
  `next.config.ts` already allows `cdn.shopify.com` and `*.supabase.co`.
- **Reviews.** `src/data/reviews.ts` is sample data and is flagged as such on
  the homepage. Set `PLACEHOLDER_REVIEWS = false` once real reviews exist and
  the notice disappears.
- **Delivery times and return window.** Currently 2–5 working days and 7 days.
  Used in `src/app/(storefront)/faq/page.tsx`,
  `src/app/(storefront)/policies/[slug]/page.tsx` and
  `site.shippingBlurb` in `src/lib/site.ts`.
- **Policy copy.** Starter text, not legal advice — have it reviewed.
- **Bank account details.** `bankAccount` in `src/lib/site.ts` is dummy data
  and is shown to anyone who picks bank transfer at checkout. Replace it, or
  drop that entry from `paymentMethods` to offer cash on delivery only.
- **Delivery rates.** `deliveryMethods` currently quotes Rs. 250 standard and
  Rs. 450 express — set these to what your courier actually charges.

---

## The dashboard

`/admin` is a small back office: add a product, edit or remove one, see what
needs restocking, issue coupon codes, and shape how the catalogue is organised
— categories, tags and the colour palette. Anything saved is live on the
storefront immediately.

### Setting it up

One environment variable is all it needs. Copy `.env.example` to `.env.local`
and set a password:

```
ADMIN_PASSWORD=choose-something-long
```

Restart the dev server, then open [`/admin`](http://localhost:3000/admin).
There is a single operator account; the password signs you in for seven days
via an HTTP-only, signed cookie. Set `ADMIN_SESSION_SECRET` as well if you want
to change the password without signing everyone out.

Without `ADMIN_PASSWORD` the login page says so and refuses every attempt —
it never falls back to a default password.

### Where the data goes

| What | Where | Notes |
| --- | --- | --- |
| Products added or edited | `data/catalogue.json` | Created on first save |
| Categories, tags and colours | `data/taxonomy.json` | Created on first save |
| Coupons and their redemption counts | `data/coupons.json` | Created on first save |
| Uploaded photos | `public/uploads/` | Served straight off the origin |

The seed catalogue in `src/data/products.ts` is never rewritten. The dashboard
keeps an **overlay** — edited products shadow the seed, removed ones are
tombstoned, new ones are appended — and `src/lib/repository.ts` merges the two
on every read. So an edit is always reversible, and a removed starter product
can be restored from the bottom of the products list.

Both paths are ordinary files, which means:

- They must live on a **persistent disk**. On a normal Node host (a VPS,
  Docker with a volume, Railway, Render) this works as-is. On a read-only
  serverless filesystem such as Vercel, writes will not survive — point
  `saveProduct` in `src/lib/admin/store.ts` at a database and
  `saveUploadedImages` in `src/lib/admin/uploads.ts` at object storage. Both
  return the same shapes, so no page or component changes.
- They are **your content**, so they are not git-ignored. Commit them if you
  deploy by pushing, and include them in whatever you back up.

### Categories, tags and colours

Three pages under **Catalogue** in the sidebar decide how the shop is organised.
Categories and colours ship with the store and are overlaid exactly like
products — edits shadow the seed, removals are recoverable, additions are
appended.

**Categories** (`/admin/categories`) drive the menu, the homepage grid, the
filters and the sitemap. Each has a name, web address, tagline, description, a
card image and a wider banner, a position, and a "feature on the homepage"
switch. A category can only be removed once nothing is filed under it — the
list hides the button while products remain, and the action refuses it too, so
no product is ever stranded on a page that 404s.

**Tags** (`/admin/tags`) are editorial labels that cut across categories:
"gift idea", "under 2000", "new in". Create them here, apply them from the
product form, and shoppers filter by them in the shop and reach them from chips
on the product page. Renaming a tag changes only its display name — products
store the slug, so `/shop?tag=gift-idea` links you have already shared keep
working. Deleting one also takes it off every product carrying it.

**Colours** (`/admin/colours`) is the store's palette — the swatches on
product options and the colours shoppers filter by. Add a colour with a name
and a hex value, or re-point an existing one; every product using that colour
by name picks the change up. Names are the key products store, so they are
fixed once created. Removing a colour leaves products that reference it
working — they simply lose the swatch dot.

### Coupons

`/admin/coupons` issues codes customers redeem at checkout. Three kinds:

| Type | Takes off |
| --- | --- |
| Percentage off | A share of the subtotal, optionally capped in rupees |
| Fixed amount off | A flat sum, never more than the basket is worth |
| Free delivery | The shipping fee for that order |

Each code can carry a minimum spend, a start and end date, and a total number
of uses. **Active** can be switched off to refuse a seasonal code without
deleting it and losing its history. "Generate" invents a code from an alphabet
with no ambiguous characters, so it survives being read down a phone line.

Customers enter the code in the order summary at checkout. The rules live in
`src/lib/coupons.ts` and run in three places against the same functions: the
checkout prices the basket as the customer changes delivery method,
`/api/coupons` re-prices from the catalogue when a code is applied, and
`/api/orders` checks it once more before charging — so a code that expires or
runs out mid-checkout is refused rather than honoured. The redemption count is
incremented inside the store's lock, which is what stops two simultaneous
orders both spending the last use of a single-use code.

The free-delivery threshold is judged on the subtotal *before* any coupon, so a
discount can never push a basket back under it partway through checkout.

### Photo addresses

`next/image` only loads remote images from the hosts listed in
`images.remotePatterns` in `next.config.ts`. The form enforces the same list,
so a pasted URL from anywhere else is rejected with an explanation rather than
rendering as a broken image later. Uploaded files are site-relative and always
allowed.

### Security notes

- `src/proxy.ts` redirects signed-out visitors away from `/admin`, but that is
  only a convenience. Server Actions are reachable by direct POST, so every
  action and the dashboard layout call `requireAdmin()` themselves.
- `/admin` is excluded from `robots.txt` and every dashboard page is
  `noindex`.
- Put the site behind HTTPS in production — the session cookie is only marked
  `secure` when `NODE_ENV=production`.

---

## Adding a backend

No component imports product data directly. Every read goes through
`src/lib/repository.ts`, and every function there is `async`. To move to
Supabase, the Shopify Storefront API or a custom admin backend, reimplement
that one file against the same signatures — pages and components do not change.

```ts
getCatalogue()              // seed + dashboard overlay, the source for the rest
getProducts(query)          // filter / sort / paginate, returns { items, total }
getProductBySlug(slug)
getAllProductSlugs()        // drives generateStaticParams
getRelatedProducts(product)
getRecommendations(exclude) // cart drawer cross-sell
getCategories() / getCategoryBySlug() / getCategoryCounts()
getFacets(scope)            // filter panel values + counts
getTags() / getSwatches()      // dashboard-managed taxonomy
getCoupons() / getCouponByCode(code)
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
- **Accounts** — `src/app/(storefront)/account/page.tsx` is a placeholder. The
  dashboard has its own single-operator sign-in and shares nothing with it.
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
