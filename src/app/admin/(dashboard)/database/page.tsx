import { Database, HardDrive, ShieldAlert } from "lucide-react";
import { ImportButton } from "@/components/admin/ImportButton";
import { countCustomers } from "@/lib/account/store";
import { countOrders } from "@/lib/order-store";
import { getCatalogue, getCategories, getCoupons, getTags } from "@/lib/repository";
import { IMAGE_BUCKET, isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata = { title: "Database" };

/**
 * Where the store keeps its data, and the one-time import that moves it into
 * Supabase.
 *
 * Deliberately readable by an operator rather than a developer: which backend
 * is live, what is in it, and what to do next if the answer is "files".
 */
export default async function AdminDatabasePage() {
  const connected = isSupabaseConfigured();

  const [products, categories, tags, coupons, customers, orders] =
    await Promise.all([
      getCatalogue(),
      getCategories(),
      getTags(),
      getCoupons(),
      countCustomers(),
      countOrders(),
    ]);

  const rows: { label: string; count: number }[] = [
    { label: "Products", count: products.length },
    { label: "Categories", count: categories.length },
    { label: "Tags", count: tags.length },
    { label: "Coupons", count: coupons.length },
    { label: "Customer accounts", count: customers },
    { label: "Orders", count: orders },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[1.5rem]">Database</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Where this store keeps its products, orders and customers.
        </p>
      </header>

      <section
        className={`rounded-tile border p-5 sm:p-6 ${
          connected ? "border-mint-deep bg-mint" : "border-line bg-paper shadow-card"
        }`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              connected ? "bg-paper text-mint-ink" : "bg-sand text-muted"
            }`}
          >
            {connected ? (
              <Database size={18} strokeWidth={1.7} />
            ) : (
              <HardDrive size={18} strokeWidth={1.7} />
            )}
          </span>

          <div className="min-w-0">
            <p
              className={`text-[14px] font-semibold ${connected ? "text-mint-ink" : ""}`}
            >
              {connected ? "Connected to Supabase" : "Running on files"}
            </p>
            <p
              className={`mt-1 text-[12.5px] leading-relaxed ${
                connected ? "text-mint-ink/80" : "text-muted"
              }`}
            >
              {connected ? (
                <>
                  Products, coupons, accounts and orders are read from and
                  written to Postgres, and product photos go to the{" "}
                  <code className="rounded bg-paper/70 px-1 py-0.5 text-[11.5px]">
                    {IMAGE_BUCKET}
                  </code>{" "}
                  storage bucket.
                </>
              ) : (
                <>
                  Everything is stored in JSON files under{" "}
                  <code className="rounded bg-sand px-1 py-0.5 text-[11.5px]">
                    data/
                  </code>{" "}
                  and photos in{" "}
                  <code className="rounded bg-sand px-1 py-0.5 text-[11.5px]">
                    public/uploads/
                  </code>
                  . That works on a server with a real disk. On a serverless
                  host every save is lost at the next deploy — connect Supabase
                  before launching there.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-tile border border-line bg-paper shadow-card">
        <h2 className="border-b border-line px-5 py-4 text-[14px] font-semibold">
          What is in it
        </h2>
        <ul>
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between border-b border-line px-5 py-3 last:border-0"
            >
              <span className="text-[13px] text-ink-soft">{row.label}</span>
              <span className="text-[13px] font-medium tabular-nums">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {connected ? (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
          <h2 className="text-[14px] font-semibold">Import the starting data</h2>
          <p className="mt-1.5 max-w-prose text-[12.5px] leading-relaxed text-muted">
            Copies the catalogue this store ships with — and anything already
            saved under <code className="rounded bg-sand px-1 py-0.5">data/</code>{" "}
            while it was running on files — into Supabase. Products that are
            already there are left exactly as they are, so running it twice is
            safe.
          </p>
          <div className="mt-5">
            <ImportButton />
          </div>
        </section>
      ) : (
        <section className="rounded-tile border border-line bg-paper p-5 shadow-card sm:p-6">
          <h2 className="text-[14px] font-semibold">Connecting Supabase</h2>
          <ol className="mt-4 flex flex-col gap-3 text-[12.5px] leading-relaxed text-ink-soft">
            <Step index={1}>
              Create a project at <strong>supabase.com</strong> (the free tier is
              enough to launch).
            </Step>
            <Step index={2}>
              Open <strong>SQL Editor</strong>, paste the contents of{" "}
              <code className="rounded bg-sand px-1 py-0.5">
                supabase/schema.sql
              </code>{" "}
              from this project, and run it.
            </Step>
            <Step index={3}>
              Under <strong>Storage</strong>, create a public bucket named{" "}
              <code className="rounded bg-sand px-1 py-0.5">{IMAGE_BUCKET}</code>{" "}
              for product photos.
            </Step>
            <Step index={4}>
              Copy the project URL and the <strong>service role</strong> key from{" "}
              <strong>Project Settings → API</strong> into{" "}
              <code className="rounded bg-sand px-1 py-0.5">.env.local</code> as{" "}
              <code className="rounded bg-sand px-1 py-0.5">SUPABASE_URL</code>{" "}
              and{" "}
              <code className="rounded bg-sand px-1 py-0.5">
                SUPABASE_SERVICE_ROLE_KEY
              </code>
              , then restart the server.
            </Step>
            <Step index={5}>
              Come back here and press <strong>Import</strong> to fill the new
              database.
            </Step>
          </ol>

          <p className="mt-5 flex items-start gap-2 rounded-card bg-sand px-4 py-3 text-[12px] leading-relaxed text-muted">
            <ShieldAlert
              size={14}
              strokeWidth={1.9}
              className="mt-0.5 shrink-0 text-accent"
            />
            The service role key bypasses every access rule in the database. It
            belongs in the server environment only — never in a{" "}
            <code className="rounded bg-paper px-1 py-0.5">NEXT_PUBLIC_</code>{" "}
            variable, and never in a commit.
          </p>
        </section>
      )}
    </div>
  );
}

function Step({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand tabular-nums">
        {index}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
