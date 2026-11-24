-- Schema for the presentation-maker clone. Postgres 15+.
-- Access rules: one authorisation check per query in the data layer
-- (src/server/queries.ts). Every user-owned row carries user_id and every
-- query filters on it. No RLS: the app talks to Postgres with one server role.
-- Times are timestamptz (UTC). gen_random_uuid() is core since Postgres 13.


create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default '',
  password_hash text,                       -- null for magic-link / OAuth only users
  plan text not null default 'free' check (plan in ('free','plus','pro')),
  credits integer not null default 400 check (credits >= 0),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));
create unique index users_stripe_customer_key on users (stripe_customer_id) where stripe_customer_id is not null;

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,                 -- sha256 of the cookie token; raw token never stored
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create unique index sessions_token_key on sessions (token_hash);
create index sessions_user_idx on sessions (user_id);
create index sessions_expires_idx on sessions (expires_at);

create table email_tokens (                 -- magic links and password resets
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('magic_link','password_reset','verify_email')),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index email_tokens_token_key on email_tokens (token_hash);
create index email_tokens_user_idx on email_tokens (user_id);

create table themes (                        -- custom themes; built-in themes live in code
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  tokens jsonb not null,                     -- {fonts:{heading,body}, colors:{...}, radius}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index themes_user_idx on themes (user_id);

create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default 'Untitled',
  slug text not null,                        -- public URL id, random, unguessable
  format text not null default 'presentation'
    check (format in ('presentation','document','webpage','social')),
  theme_id text not null default 'paper',    -- built-in key, or 'custom:<uuid>'
  dimensions text not null default 'fluid'
    check (dimensions in ('fluid','16x9','4x3','letter','a4','1x1','4x5','9x16')),
  link_access text not null default 'none' check (link_access in ('none','view')),
  is_favorite boolean not null default false,
  is_template boolean not null default false,
  archived_at timestamptz,                   -- in trash when set
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index decks_slug_key on decks (slug);
create index decks_user_updated_idx on decks (user_id, updated_at desc);
create index decks_user_archived_idx on decks (user_id, archived_at);

create table cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  position integer not null check (position >= 0),
  layout text not null default 'none'
    check (layout in ('none','accent_left','accent_right','accent_top','background')),
  image_url text,
  image_alt text not null default '',
  content jsonb not null default '[]',       -- ordered block list, see src/lib/blocks.ts
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- deferrable so a reorder can rewrite positions in one transaction
alter table cards add constraint cards_deck_position_key unique (deck_id, position) deferrable initially deferred;
create index cards_deck_idx on cards (deck_id);

create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  deck_id uuid references decks(id) on delete set null,
  source text not null check (source in ('prompt','paste','import','ai_edit')),
  input_text text not null,
  settings jsonb not null default '{}',      -- numCards, textMode, amount, tone, audience, language, imageSource, themeId
  outline jsonb,
  status text not null default 'pending'
    check (status in ('pending','outline','generating','completed','failed')),
  credits_used integer not null default 0 check (credits_used >= 0),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index generations_user_created_idx on generations (user_id, created_at desc);
create index generations_deck_idx on generations (deck_id);

create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('signup','generation','ai_edit','refund','purchase','plan_refill')),
  ref_id text,                               -- generation id or stripe event id
  created_at timestamptz not null default now()
);
create index credit_ledger_user_idx on credit_ledger (user_id, created_at desc);
-- a Stripe event can only grant credits once
create unique index credit_ledger_ref_key on credit_ledger (reason, ref_id) where ref_id is not null and reason in ('purchase','plan_refill');

create table deck_views (                    -- analytics beacon, one row per viewer session per deck
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  viewer_key text not null,                  -- random id in a first-party cookie, not PII
  cards_seen integer not null default 0,
  seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index deck_views_deck_viewer_key on deck_views (deck_id, viewer_key);
create index deck_views_deck_created_idx on deck_views (deck_id, created_at desc);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stripe_subscription_id text not null,
  plan text not null check (plan in ('plus','pro')),
  status text not null,                      -- mirrors Stripe status
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscriptions_stripe_key on subscriptions (stripe_subscription_id);
create index subscriptions_user_idx on subscriptions (user_id);

create table stripe_events (                 -- webhook idempotency
  id text primary key,                       -- Stripe event id
  type text not null,
  processed_at timestamptz not null default now()
);
-- Email verification, Google sign-in and photo credits.
alter table users add column email_verified_at timestamptz;
alter table users add column google_sub text;
create unique index users_google_sub_key on users (google_sub) where google_sub is not null;
alter table cards add column image_credit text not null default '';
-- Deck-wide text size (fix from replica-entrepreneur: whole-deck text size in one go).
alter table decks add column text_scale text not null default 'm' check (text_scale in ('s','m','l','xl'));
