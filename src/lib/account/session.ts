import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { CustomerAccount } from "@/lib/types";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_NAME_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  readSessionToken,
} from "./auth";
import { findCustomerById, sessionSecret, toAccount } from "./store";

/**
 * The account side of a request: who is signed in, and how that changes.
 *
 * Every page, action and route handler that needs a customer goes through
 * `currentCustomer()` — a signed cookie alone is never enough, because the
 * account it names may have been deleted since. The lookup is memoised per
 * render pass, so a layout and its page cost one read between them.
 */

export const currentCustomer = cache(
  async (): Promise<CustomerAccount | null> => {
    const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
    if (!token) return null;

    const id = await readSessionToken(token, await sessionSecret());
    if (!id) return null;

    const customer = await findCustomerById(id);
    return customer ? toAccount(customer) : null;
  },
);

/**
 * The signed-in customer, or a redirect to sign in and come back.
 *
 * `next` is the path to return to; it is only ever read back through
 * `safeNext()`, which refuses anything but a path on this site.
 */
export async function requireCustomer(next: string): Promise<CustomerAccount> {
  const customer = await currentCustomer();
  if (customer) return customer;
  redirect(`/account/login?next=${encodeURIComponent(next)}`);
}

export async function startCustomerSession(customer: {
  id: string;
  firstName: string;
}): Promise<void> {
  const store = await cookies();
  const shared = {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  } as const;

  store.set(
    CUSTOMER_COOKIE,
    await createSessionToken(customer.id, await sessionSecret()),
    { ...shared, httpOnly: true },
  );

  /* Display only, and readable by the browser on purpose — see the cookie's
     definition in `auth.ts`. */
  store.set(CUSTOMER_NAME_COOKIE, customer.firstName.slice(0, 40), shared);
}

export async function endCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
  store.delete(CUSTOMER_NAME_COOKIE);
}
