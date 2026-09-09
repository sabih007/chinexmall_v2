import "server-only";

import { requireSupabase } from "@/lib/supabase/client";
import { ensure } from "@/lib/supabase/query";
import { fromCustomer, toCustomer } from "@/lib/supabase/rows";
import type { CustomerRecord } from "@/lib/types";
import { randomHex } from "./auth";
import { newCustomerId, normaliseEmail, type NewCustomer } from "./store.file";

/* -------------------------------------------------------------------------- */
/*  Customer accounts — the Postgres backend                                   */
/*                                                                             */
/*  One row per shopper, with a unique index on `lower(email)` doing the work   */
/*  the file backend has to do inside a lock: two sign-ups racing on the same   */
/*  address, and the database refuses the second.                              */
/* -------------------------------------------------------------------------- */

const TABLE = "customers";
const SECRET_KEY = "customer_session_secret";

/** Postgres's unique-violation code — here, the email index. */
const UNIQUE_VIOLATION = "23505";

let cachedSecret: string | null = null;

/**
 * The key session cookies are signed with, kept in `settings`.
 *
 * Generated on first use, and inserted with `ignoreDuplicates` so two instances
 * starting at once still agree on one secret: whoever loses the race reads the
 * winner's value back.
 */
export async function sessionSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;

  const db = requireSupabase();

  const { data: existing, error: readError } = await db
    .from("settings")
    .select("value")
    .eq("key", SECRET_KEY)
    .maybeSingle();

  ensure(readError);

  if (typeof existing?.value === "string" && existing.value) {
    cachedSecret = existing.value;
    return cachedSecret;
  }

  const { error: writeError } = await db
    .from("settings")
    .upsert(
      { key: SECRET_KEY, value: randomHex(32) },
      { onConflict: "key", ignoreDuplicates: true },
    );

  ensure(writeError);

  const { data: settled, error: rereadError } = await db
    .from("settings")
    .select("value")
    .eq("key", SECRET_KEY)
    .maybeSingle();

  ensure(rereadError);

  if (typeof settled?.value !== "string" || !settled.value) {
    throw new Error("Could not read or create the customer session secret.");
  }

  cachedSecret = settled.value;
  return cachedSecret;
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export async function findCustomerById(
  id: string,
): Promise<CustomerRecord | null> {
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  ensure(error);
  return data ? toCustomer(data) : null;
}

export async function findCustomerByEmail(
  email: string,
): Promise<CustomerRecord | null> {
  const wanted = normaliseEmail(email);
  if (!wanted) return null;

  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select("*")
    .eq("email", wanted)
    .maybeSingle();

  ensure(error);
  return data ? toCustomer(data) : null;
}

export async function countCustomers(): Promise<number> {
  const { count, error } = await requireSupabase()
    .from(TABLE)
    .select("id", { count: "exact", head: true });

  ensure(error);
  return count ?? 0;
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

/** Creates an account, or returns null if the email is already registered. */
export async function createCustomer(
  input: NewCustomer,
): Promise<CustomerRecord | null> {
  const now = new Date().toISOString();
  const customer: CustomerRecord = {
    id: newCustomerId(),
    email: normaliseEmail(input.email),
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    address: null,
    marketingOptIn: input.marketingOptIn,
    passwordHash: input.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await requireSupabase()
    .from(TABLE)
    .insert(fromCustomer(customer))
    .select("*")
    .maybeSingle();

  if (error?.code === UNIQUE_VIOLATION) return null;
  ensure(error);

  return data ? toCustomer(data) : customer;
}

/** Applies `change` to the stored record and returns it, or null if it is gone. */
export async function updateCustomer(
  id: string,
  change: (customer: CustomerRecord) => void,
): Promise<CustomerRecord | null> {
  const customer = await findCustomerById(id);
  if (!customer) return null;

  change(customer);
  customer.email = normaliseEmail(customer.email);
  customer.updatedAt = new Date().toISOString();

  const { data, error } = await requireSupabase()
    .from(TABLE)
    .update(fromCustomer(customer))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  ensure(error);
  return data ? toCustomer(data) : null;
}

/* -------------------------------------------------------------------------- */
/*  Import                                                                    */
/* -------------------------------------------------------------------------- */

export async function importCustomers(
  customers: CustomerRecord[],
): Promise<number> {
  if (customers.length === 0) return 0;

  const { error } = await requireSupabase()
    .from(TABLE)
    .upsert(customers.map(fromCustomer), {
      onConflict: "id",
      ignoreDuplicates: true,
    });

  ensure(error);
  return customers.length;
}
