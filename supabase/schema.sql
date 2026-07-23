-- ============================================================
--  Karte — schéma de base de données (Supabase / Postgres)
--  À exécuter dans Supabase > SQL Editor pour activer la prod.
-- ============================================================

-- Profils utilisateurs (liés à auth.users de Supabase)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  plan        text not null default 'personal',     -- personal | pro | agency
  ai_credits  integer not null default 50,
  lang        text not null default 'fr',
  created_at  timestamptz not null default now()
);

-- Workspaces (organisation des campagnes, multi-clients)
create table if not exists public.workspaces (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null default 'Mon espace',
  custom_domain text,
  created_at    timestamptz not null default now()
);

-- Cartes / campagnes
create table if not exists public.cards (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  slug         text unique not null,
  title        text not null default 'Ma carte',
  type         text not null default 'card',          -- card | campaign
  theme_index  integer not null default 0,
  blocks       jsonb not null default '[]'::jsonb,     -- bibliothèque de blocs Karte
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Leads capturés (bloc Subscribe / formulaires)
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  source     text,
  ai_score   text,        -- chaud | tiède | froid (Phase 2)
  ai_summary text,        -- résumé IA (Phase 2)
  created_at timestamptz not null default now()
);

-- Statistiques (vues, taps, leads, chat, ventes)
create table if not exists public.analytics (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.cards(id) on delete cascade,
  event      text not null,                            -- view | tap | lead | chat | sale
  geo        text,
  device     text,
  created_at timestamptz not null default now()
);

-- ============================================================
--  Row Level Security : chacun ne voit que ses données,
--  mais les cartes publiées sont lisibles par tous (page publique).
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.workspaces enable row level security;
alter table public.cards      enable row level security;
alter table public.leads      enable row level security;

create policy "profiles: self"      on public.profiles   for all using (auth.uid() = id);
create policy "workspaces: owner"   on public.workspaces for all using (auth.uid() = owner_id);
create policy "cards: owner"        on public.cards      for all using (auth.uid() = owner_id);
create policy "cards: public read"  on public.cards      for select using (published = true);
create policy "leads: card owner"   on public.leads      for select using (
  exists (select 1 from public.cards c where c.id = leads.card_id and c.owner_id = auth.uid())
);
create policy "leads: anyone insert" on public.leads     for insert with check (true);

-- Crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  KARTE V2 — extensions : clients agence, fidélité, storage
--  (à exécuter après le bloc ci-dessus, ou tout en une fois)
-- ============================================================

-- Clients gérés par une agence (technologie agence)
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references auth.users(id) on delete cascade,
  company     text not null,
  email       text not null,
  auth_id     uuid references auth.users(id) on delete set null, -- compte de connexion du client
  created_at  timestamptz not null default now()
);

-- Lien workspace → client + permissions granulaires + carte
alter table public.workspaces add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.workspaces add column if not exists card_id   uuid references public.cards(id) on delete set null;
alter table public.workspaces add column if not exists permissions jsonb not null default
  '{"editText":true,"editStructure":false,"publish":false,"viewLeads":true}'::jsonb;

-- ---------- Fidélité (bloc loyalty) ----------
create table if not exists public.loyalty_members (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  block_id    text not null,                -- id du bloc loyalty dans cards.blocks
  identity    text not null,                -- prénom ou téléphone saisi par le visiteur
  stamps      integer not null default 0,
  last_stamp  date,
  created_at  timestamptz not null default now(),
  unique (card_id, block_id, identity)
);

create table if not exists public.loyalty_coupons (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.loyalty_members(id) on delete cascade,
  code        text not null unique,
  reward      text not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.loyalty_members enable row level security;
alter table public.loyalty_coupons enable row level security;
alter table public.clients         enable row level security;
alter table public.analytics       enable row level security;

-- Le commerçant (owner de la carte) voit ses membres ; le visiteur anonyme peut créer/incrémenter
create policy "loyalty: card owner read" on public.loyalty_members for select using (
  exists (select 1 from public.cards c where c.id = loyalty_members.card_id and c.owner_id = auth.uid())
);
create policy "loyalty: anon insert" on public.loyalty_members for insert with check (true);
create policy "loyalty: anon update" on public.loyalty_members for update using (true);
create policy "coupons: member flow" on public.loyalty_coupons for all using (true) with check (true);
create policy "clients: agency" on public.clients for all using (auth.uid() = agency_id);
create policy "analytics: owner read" on public.analytics for select using (
  exists (select 1 from public.cards c where c.id = analytics.card_id and c.owner_id = auth.uid())
);
create policy "analytics: anon insert" on public.analytics for insert with check (true);

-- ---------- updated_at automatique ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists cards_touch on public.cards;
create trigger cards_touch before update on public.cards
  for each row execute function public.touch_updated_at();

-- ---------- Storage : bucket images (bannières, galeries, menus…) ----------
insert into storage.buckets (id, name, public)
  values ('karte-images', 'karte-images', true)
  on conflict (id) do nothing;

create policy "images: public read" on storage.objects
  for select using (bucket_id = 'karte-images');
create policy "images: auth upload" on storage.objects
  for insert with check (bucket_id = 'karte-images' and auth.role() = 'authenticated');
create policy "images: owner delete" on storage.objects
  for delete using (bucket_id = 'karte-images' and owner = auth.uid());
