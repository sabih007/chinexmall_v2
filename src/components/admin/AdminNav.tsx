"use client";

import {
  Database,
  FolderTree,
  LayoutGrid,
  Package,
  PackagePlus,
  Palette,
  Receipt,
  Tags,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/* Each link says for itself which paths light it up: "Add product" sits under
   "Products", so a plain prefix match would highlight both. */
interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  matches: (path: string) => boolean;
}

const groups: { title?: string; links: NavLink[] }[] = [
  {
    links: [
      {
        href: "/admin",
        label: "Overview",
        icon: LayoutGrid,
        matches: (path) => path === "/admin",
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: Receipt,
        matches: (path) => path.startsWith("/admin/orders"),
      },
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
        matches: (path) =>
          path.startsWith("/admin/products") && path !== "/admin/products/new",
      },
      {
        href: "/admin/products/new",
        label: "Add product",
        icon: PackagePlus,
        matches: (path) => path === "/admin/products/new",
      },
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: Ticket,
        matches: (path) => path.startsWith("/admin/coupons"),
      },
    ],
  },
  {
    title: "Catalogue",
    links: [
      {
        href: "/admin/categories",
        label: "Categories",
        icon: FolderTree,
        matches: (path) => path.startsWith("/admin/categories"),
      },
      {
        href: "/admin/tags",
        label: "Tags",
        icon: Tags,
        matches: (path) => path.startsWith("/admin/tags"),
      },
      {
        href: "/admin/colours",
        label: "Colours",
        icon: Palette,
        matches: (path) => path.startsWith("/admin/colours"),
      },
    ],
  },
  {
    title: "Store",
    links: [
      {
        href: "/admin/database",
        label: "Database",
        icon: Database,
        matches: (path) => path.startsWith("/admin/database"),
      },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 lg:flex-col lg:gap-5">
      {groups.map((group, index) => (
        <div key={group.title ?? index} className="flex gap-1 lg:flex-col">
          {group.title && (
            <p className="hidden px-3.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted lg:block">
              {group.title}
            </p>
          )}
          {group.links.map(({ href, label, icon: Icon, matches }) => {
            const active = matches(pathname);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] transition-colors lg:rounded-[10px]",
                  active
                    ? "bg-brand-soft font-medium text-brand"
                    : "text-ink-soft hover:bg-sand",
                )}
              >
                <Icon size={16} strokeWidth={1.7} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
