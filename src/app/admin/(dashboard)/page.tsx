import {
  AlertTriangle,
  ArrowUpRight,
  PackagePlus,
  Package,
  Receipt,
  Tag,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { couponStatus } from "@/lib/coupons";
import { listOrders } from "@/lib/order-store";
import { statusLabels, statusTones } from "@/lib/order-status";
import { discountPercent, formatDate, formatPrice } from "@/lib/format";
import {
  getCatalogue,
  getCategories,
  getCoupons,
  isSeedProduct,
} from "@/lib/repository";
import { site } from "@/lib/site";

export const metadata = { title: "Overview" };

/** Signed-in landing page: the numbers worth knowing, then the way in. */
export default async function AdminOverviewPage() {
  const [products, categories, orders, coupons] = await Promise.all([
    getCatalogue(),
    getCategories(),
    listOrders(),
    getCoupons(),
  ]);

  const openOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "confirmed",
  );
  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totals.total, 0);

  const outOfStock = products.filter((p) => p.stock <= 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const onSale = products.filter(
    (p) => discountPercent(p.price, p.compareAtPrice) > 0,
  );
  const authored = products.filter((p) => !isSeedProduct(p.id));
  const liveCoupons = coupons.filter((c) => couponStatus(c) === "active");

  const recent = [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.5rem]">Overview</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {orders.length === 0
              ? "No orders yet — the storefront is ready for the first one."
              : `${orders.length} order${orders.length === 1 ? "" : "s"} · ${formatPrice(revenue)} placed`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-brand-hover"
        >
          <PackagePlus size={16} strokeWidth={1.8} />
          Add product
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="Orders to handle"
          value={openOrders.length}
          icon={Receipt}
          href="/admin/orders"
          tone={openOrders.length > 0 ? "warn" : undefined}
        />
        <Stat label="Products live" value={products.length} icon={Package} />
        <Stat label="Added here" value={authored.length} icon={PackagePlus} />
        <Stat label="On sale" value={onSale.length} icon={Tag} />
        <Stat
          label="Coupons running"
          value={liveCoupons.length}
          icon={Ticket}
          href="/admin/coupons"
        />
        <Stat
          label="Out of stock"
          value={outOfStock.length}
          icon={AlertTriangle}
          tone={outOfStock.length > 0 ? "warn" : undefined}
        />
      </div>

      {orders.length > 0 && (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-semibold">Latest orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-[12.5px] text-brand hover:underline"
            >
              All orders
              <ArrowUpRight size={13} strokeWidth={1.8} />
            </Link>
          </div>

          <ul className="divide-y divide-line">
            {orders.slice(0, 5).map((order) => (
              <li
                key={order.number}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/orders/${order.number}`}
                    className="font-mono text-[13px] font-semibold tracking-wide hover:text-brand"
                  >
                    {order.number}
                  </Link>
                  <p className="truncate text-[12px] text-muted">
                    {order.customer.firstName} {order.customer.lastName} ·{" "}
                    {order.customer.city} · {formatDate(order.placedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusTones[order.status]}`}
                >
                  {statusLabels[order.status]}
                </span>
                <span className="w-20 shrink-0 text-right text-[13px] font-medium tabular-nums">
                  {formatPrice(order.totals.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
          <h2 className="text-[15px] font-semibold">Needs restocking</h2>
          <ul className="mt-4 divide-y divide-line">
            {[...outOfStock, ...lowStock].slice(0, 6).map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <Link
                  href={`/admin/products/${product.id}`}
                  className="truncate text-[13px] hover:text-brand"
                >
                  {product.name}
                </Link>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${
                    product.stock <= 0
                      ? "bg-accent-soft text-accent"
                      : "bg-gold-soft text-ink"
                  }`}
                >
                  {product.stock <= 0 ? "Sold out" : `${product.stock} left`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[15px] font-semibold">Newest products</h2>
          <Link
            href="/admin/products"
            className="flex items-center gap-1 text-[12.5px] text-brand hover:underline"
          >
            All products
            <ArrowUpRight size={13} strokeWidth={1.8} />
          </Link>
        </div>

        <ul className="divide-y divide-line">
          {recent.map((product) => (
            <li key={product.id} className="flex items-center gap-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnail}
                alt=""
                className="h-11 w-11 shrink-0 rounded-[8px] border border-line object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="block truncate text-[13.5px] font-medium hover:text-brand"
                >
                  {product.name}
                </Link>
                <p className="truncate text-[12px] text-muted">
                  {product.productType} · added {formatDate(product.createdAt)}
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-medium tabular-nums">
                {formatPrice(product.price)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[12px] leading-relaxed text-muted">
        {categories.length} categories are available to file products under, and
        the catalogue is served from {site.name}&apos;s data layer — every change
        here is live on the storefront straight away.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone?: "warn";
  /** Turns the tile into a link to the section it counts. */
  href?: string;
}) {
  const className = `block rounded-tile border border-line bg-paper p-4 shadow-card${
    href ? " transition-colors hover:border-brand/40" : ""
  }`;

  const body = (
    <>
      <Icon
        size={17}
        strokeWidth={1.7}
        className={tone === "warn" ? "text-accent" : "text-brand"}
      />
      <p className="mt-3 text-[26px] font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
