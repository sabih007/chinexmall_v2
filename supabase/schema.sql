-- ChineXmall — Supabase schema
--
-- Run once, in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to run again: every statement is guarded.
--
-- The app talks to this database only from the server, with the service role
-- key. Row Level Security is therefore switched on with **no policies at all**:
-- the anon key that ships in a browser can read nothing here, and the service
-- role bypasses RLS by design. If you later let browsers query Supabase
-- directly, add policies deliberately — do not disable RLS.

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table if not exists products (
  id                text primary key,
  slug              text not null unique,
  name              text not null,
  category          text not null default '',
  subcategory       text,
  description       text not null default '',
  short_description text not null default '',
  price             numeric(12, 2) not null default 0,
  compare_at_price  numeric(12, 2),
  images            text[] not null default '{}',
  thumbnail         text not null default '',
  variants          jsonb not null default '[]'::jsonb,
  sku               text not null default '',
  stock             integer not null default 0,
  featured          boolean not null default false,
  best_seller       boolean not null default false,
  new_arrival       boolean not null default false,
  trending          boolean not null default false,
  brand             text not null default '',
  material          text not null default '',
  dimensions        text not null default '',
  weight            text not null default '',
  shipping_info     text not null default '',
  whats_included    text[] not null default '{}',
  details           text[] not null default '{}',
  color_facet       text not null default '',
  product_type      text not null default '',
  tags              text[] not null default '{}',
  rating            numeric(3, 2) not null default 0,
  review_count      integer not null default 0,
  created_at        timestamptz not null default now(),
  -- Imported from src/data/products.ts rather than authored in the dashboard.
  -- Removing one soft-deletes it, so the dashboard can offer it back.
  is_seed           boolean not null default false,
  deleted_at        timestamptz,
  updated_at        timestamptz not null default now()
);

create index if not exists products_live_idx on products (deleted_at);
create index if not exists products_category_idx on products (category);
create index if not exists products_tags_idx on products using gin (tags);

create table if not exists categories (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  tagline     text not null default '',
  description text not null default '',
  image       text not null default '',
  hero_image  text not null default '',
  featured    boolean not null default false,
  "order"     integer not null default 0,
  is_seed     boolean not null default false,
  deleted_at  timestamptz,
  updated_at  timestamptz not null default now()
);

create table if not exists tags (
  id         text primary key,
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- The colour vocabulary: swatch name → hex.
create table if not exists swatches (
  name       text primary key,
  hex        text not null,
  is_seed    boolean not null default false,
  deleted_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------

create table if not exists coupons (
  id           text primary key,
  code         text not null unique,
  description  text not null default '',
  type         text not null check (type in ('percentage', 'fixed', 'free-shipping')),
  value        numeric(12, 2) not null default 0,
  min_subtotal numeric(12, 2) not null default 0,
  max_discount numeric(12, 2),
  starts_at    timestamptz,
  expires_at   timestamptz,
  usage_limit  integer,
  used_count   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Counts one redemption and refuses it if the code ran out in the meantime.
-- A single statement, so two customers spending the last use of a limited code
-- at the same moment cannot both succeed.
create or replace function redeem_coupon(coupon_id text)
returns boolean
language plpgsql
as $$
declare
  redeemed integer;
begin
  update coupons
     set used_count = used_count + 1
   where id = coupon_id
     and (usage_limit is null or used_count < usage_limit);

  get diagnostics redeemed = row_count;
  return redeemed > 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- Customer accounts
-- ---------------------------------------------------------------------------

create table if not exists customers (
  id               text primary key,
  email            text not null,
  first_name       text not null default '',
  last_name        text not null default '',
  phone            text not null default '',
  address          jsonb,
  marketing_opt_in boolean not null default false,
  -- PBKDF2-SHA256, salted per account. Never a plaintext password.
  password_hash    text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One account per address, case-insensitively, enforced by the database rather
-- than by a check-then-insert that two sign-ups could race through.
create unique index if not exists customers_email_key on customers (lower(email));

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists orders (
  number      text primary key,
  placed_at   timestamptz not null default now(),
  status      text not null default 'pending'
              check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  -- Null for a guest, and kept if the account is later deleted: the order
  -- still happened, and the delivery details are snapshotted below.
  customer_id text references customers (id) on delete set null,
  -- What was ordered, as it was priced and addressed at the time. A later edit
  -- to a product or an account must never rewrite history.
  customer    jsonb not null,
  delivery    text not null,
  payment     text not null,
  lines       jsonb not null default '[]'::jsonb,
  totals      jsonb not null,
  coupon      jsonb,
  eta         text not null default '',
  updated_at  timestamptz not null default now()
);

create index if not exists orders_customer_idx on orders (customer_id, placed_at desc);
create index if not exists orders_placed_idx on orders (placed_at desc);

-- ---------------------------------------------------------------------------
-- Server-side settings (the customer session signing secret)
-- ---------------------------------------------------------------------------

create table if not exists settings (
  key   text primary key,
  value text not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security: on everywhere, policies nowhere. See the note at the top.
-- ---------------------------------------------------------------------------

alter table products   enable row level security;
alter table categories enable row level security;
alter table tags       enable row level security;
alter table swatches   enable row level security;
alter table coupons    enable row level security;
alter table customers  enable row level security;
alter table orders     enable row level security;
alter table settings   enable row level security;
