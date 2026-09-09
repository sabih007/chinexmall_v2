import "server-only";

import { createJsonStore } from "@/lib/json-store";
import type { CustomerAccount, CustomerRecord, SavedAddress } from "@/lib/types";
import { randomHex } from "./auth";

/**
 * Where customer accounts live when the store runs on files:
 * `data/customers.json`, keyed by id. `store.db.ts` is the same contract
 * against Postgres.
 *
 * The file also holds the secret that signs session cookies, generated on
 * first use so the store works with no configuration — set
 * `CUSTOMER_SESSION_SECRET` instead when you run more than one instance, or
 * anywhere the data directory is not persistent.
 *
 * Swapping this for a database means reimplementing this module; nothing above
 * it knows that accounts are a file.
 */

interface CustomerBook {
  version: 1;
  /** Signs session cookies. Rotating it signs everyone out. */
  secret: string | null;
  customers: Record<string, CustomerRecord>;
  updatedAt: string | null;
}

const EMPTY: CustomerBook = {
  version: 1,
  secret: null,
  customers: {},
  updatedAt: null,
};

export function newCustomerId(): string {
  return `cus_${Date.now().toString(36)}${Math.floor(Math.random() * 1296)
    .toString(36)
    .padStart(2, "0")}`;
}

/** The one shape of an email address this store recognises. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAddress(value: unknown): value is SavedAddress {
  const a = value as Partial<SavedAddress> | null;
  return (
    !!a &&
    typeof a === "object" &&
    typeof a.address1 === "string" &&
    typeof a.city === "string" &&
    typeof a.province === "string"
  );
}

function isCustomer(value: unknown): value is CustomerRecord {
  const c = value as Partial<CustomerRecord> | null;
  return (
    !!c &&
    typeof c === "object" &&
    typeof c.id === "string" &&
    typeof c.email === "string" &&
    typeof c.passwordHash === "string" &&
    typeof c.firstName === "string" &&
    typeof c.lastName === "string"
  );
}

const store = createJsonStore<CustomerBook>("customers.json", EMPTY, (parsed) => {
  const raw = (parsed ?? {}) as Partial<CustomerBook>;
  const customers: Record<string, CustomerRecord> = {};

  for (const [id, customer] of Object.entries(raw.customers ?? {})) {
    if (!isCustomer(customer)) continue;
    customers[id] = {
      ...customer,
      email: normaliseEmail(customer.email),
      phone: typeof customer.phone === "string" ? customer.phone : "",
      address: isAddress(customer.address) ? customer.address : null,
      marketingOptIn: customer.marketingOptIn === true,
      createdAt: customer.createdAt ?? new Date(0).toISOString(),
      updatedAt: customer.updatedAt ?? customer.createdAt ?? new Date(0).toISOString(),
    };
  }

  return {
    version: 1,
    secret: typeof raw.secret === "string" && raw.secret ? raw.secret : null,
    customers,
    updatedAt: raw.updatedAt ?? null,
  };
});

/* -------------------------------------------------------------------------- */
/*  Session secret                                                            */
/* -------------------------------------------------------------------------- */

let cachedSecret: string | null = null;

/**
 * The key session cookies are signed with. Read once per process: generating
 * it goes through the store's lock, so two requests racing on a fresh install
 * still end up with the same secret.
 */
export async function sessionSecret(): Promise<string> {
  const configured = process.env.CUSTOMER_SESSION_SECRET?.trim();
  if (configured) return configured;

  if (cachedSecret) return cachedSecret;

  cachedSecret = await store.mutate((book) => {
    book.secret ??= randomHex(32);
    return book.secret;
  });
  return cachedSecret;
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export async function findCustomerById(
  id: string,
): Promise<CustomerRecord | null> {
  const { customers } = await store.read();
  return customers[id] ?? null;
}

export async function findCustomerByEmail(
  email: string,
): Promise<CustomerRecord | null> {
  const wanted = normaliseEmail(email);
  if (!wanted) return null;
  const { customers } = await store.read();
  return Object.values(customers).find((c) => c.email === wanted) ?? null;
}

export async function countCustomers(): Promise<number> {
  const { customers } = await store.read();
  return Object.keys(customers).length;
}

/**
 * Every account on file, password hashes included.
 *
 * The only caller is the Supabase import — an account is otherwise always
 * looked up one at a time, by id or by email.
 */
export async function listCustomers(): Promise<CustomerRecord[]> {
  const { customers } = await store.read();
  return Object.values(customers);
}

/**
 * The account as everything above this module sees it. Built field by field
 * rather than by spreading the record, so a field added to storage later is
 * never handed out by accident.
 */
export function toAccount(customer: CustomerRecord): CustomerAccount {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: customer.address,
    marketingOptIn: customer.marketingOptIn,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                    */
/* -------------------------------------------------------------------------- */

export interface NewCustomer {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingOptIn: boolean;
}

/**
 * Creates an account, or returns `null` if the email is already taken.
 *
 * The uniqueness check runs inside the store's lock rather than before it, so
 * two people registering the same address at the same moment cannot both win.
 */
export async function createCustomer(
  input: NewCustomer,
): Promise<CustomerRecord | null> {
  const email = normaliseEmail(input.email);

  return store.mutate((book) => {
    const taken = Object.values(book.customers).some((c) => c.email === email);
    if (taken) return null;

    const now = new Date().toISOString();
    const customer: CustomerRecord = {
      id: newCustomerId(),
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      address: null,
      marketingOptIn: input.marketingOptIn,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    book.customers[customer.id] = customer;
    book.updatedAt = now;
    return customer;
  });
}

/** Applies `change` to the stored record and returns it, or null if it is gone. */
export async function updateCustomer(
  id: string,
  change: (customer: CustomerRecord) => void,
): Promise<CustomerRecord | null> {
  return store.mutate((book) => {
    const customer = book.customers[id];
    if (!customer) return null;

    change(customer);
    customer.email = normaliseEmail(customer.email);
    customer.updatedAt = new Date().toISOString();
    book.updatedAt = customer.updatedAt;
    return customer;
  });
}
