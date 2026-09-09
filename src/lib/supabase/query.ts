import "server-only";

/**
 * Helpers every table module shares.
 *
 * PostgREST caps a response at 1,000 rows by default, and does it silently — a
 * catalogue that grew past the cap would simply stop showing its newest
 * products. `fetchAll` pages instead of trusting one request.
 */

const PAGE = 1000;

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

/** Just enough of a PostgREST builder to page through it. */
interface RangeQuery {
  range(from: number, to: number): PromiseLike<QueryResult>;
}

/** Runs a query to exhaustion, a page at a time. */
export async function fetchAll(
  build: () => RangeQuery,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    ensure(error);

    const page = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/** Throws with the database's own message, which is what a log wants to say. */
export function ensure(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}
