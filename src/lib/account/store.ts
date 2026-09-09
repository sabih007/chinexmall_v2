import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { CustomerAccount, CustomerRecord } from "@/lib/types";
import * as db from "./store.db";
import * as file from "./store.file";

/* -------------------------------------------------------------------------- */
/*  Customer store                                                             */
/*                                                                             */
/*  Postgres when Supabase is configured, `data/customers.json` when it is not. */
/*  Either way the rest of the account layer sees one contract, and only this   */
/*  module and its two backends ever hold a password hash.                     */
/* -------------------------------------------------------------------------- */

const backend = () => (isSupabaseConfigured() ? db : file);

export type { NewCustomer } from "./store.file";

export const newCustomerId = file.newCustomerId;
export const normaliseEmail = file.normaliseEmail;

/** Everything above this module sees an account without its password hash. */
export const toAccount = file.toAccount;

/** The key session cookies are signed with. */
export function sessionSecret(): Promise<string> {
  return backend().sessionSecret();
}

export function findCustomerById(id: string): Promise<CustomerRecord | null> {
  return backend().findCustomerById(id);
}

export function findCustomerByEmail(
  email: string,
): Promise<CustomerRecord | null> {
  return backend().findCustomerByEmail(email);
}

export function countCustomers(): Promise<number> {
  return backend().countCustomers();
}

/** Creates an account, or returns null if the email is already registered. */
export function createCustomer(
  input: file.NewCustomer,
): Promise<CustomerRecord | null> {
  return backend().createCustomer(input);
}

/** Applies `change` to the stored record; null if the account is gone. */
export function updateCustomer(
  id: string,
  change: (customer: CustomerRecord) => void,
): Promise<CustomerRecord | null> {
  return backend().updateCustomer(id, change);
}

export type { CustomerAccount };
