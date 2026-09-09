import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The one Supabase connection, and the switch the rest of the app reads.
 *
 * Configured means both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
 * set: until then every store module falls back to the JSON files in `data/`,
 * so the project still runs with no account anywhere (see the README).
 *
 * This is the **service role** key. It bypasses Row Level Security, so it is
 * confined to server-only modules — `server-only` above makes importing it
 * from a client component a build error rather than a leak. It is never sent
 * to the browser and never used in a route that echoes it back.
 */

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

let client: SupabaseClient | null = null;

/** The client, or null when the store is running on files. */
export function supabase(): SupabaseClient | null {
  if (!url || !serviceKey) return null;

  client ??= createClient(url, serviceKey, {
    auth: {
      // Nothing here signs in as a Supabase user: shoppers have their own
      // session cookie, and there is no browser to persist anything for.
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { "x-application-name": "chinexmall" },
    },
  });

  return client;
}

/**
 * The client, or a thrown error naming what is missing.
 *
 * For the paths that only exist once Supabase is configured — order history,
 * the migration script — where falling back silently would hide a broken
 * deployment.
 */
export function requireSupabase(): SupabaseClient {
  const configured = supabase();
  if (!configured) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY — see the README.",
    );
  }
  return configured;
}

/** The bucket product photos are uploaded to. Created by the setup steps. */
export const IMAGE_BUCKET = process.env.SUPABASE_IMAGE_BUCKET?.trim() || "product-images";
