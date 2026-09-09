"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useCustomerName } from "@/components/account/useCustomerName";

/**
 * The header's account control: the same circle either way, pointing at the
 * account when there is one and at the sign-in page when there is not.
 */
export function AccountLink() {
  const name = useCustomerName();

  return (
    <Link
      href={name ? "/account" : "/account/login"}
      className="hidden items-center gap-2.5 rounded-full bg-mint py-1.5 pl-1.5 pr-2 text-mint-ink transition-colors hover:bg-mint-deep lg:flex xl:pr-4"
      aria-label={name ? `Account, signed in as ${name}` : "Sign in"}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper/70">
        <User size={15} strokeWidth={1.8} />
      </span>
      <span className="hidden leading-tight xl:block">
        <span className="block text-[10px] opacity-70">
          {name ? "Hello," : "Account"}
        </span>
        <span className="block max-w-[9ch] truncate text-[12.5px] font-semibold">
          {name ?? "Sign in"}
        </span>
      </span>
    </Link>
  );
}
