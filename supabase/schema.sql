-- ============================================================================
-- FITZY — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Every table is protected by Row Level Security: users only ever touch
-- their own wardrobe, outfits and preferences.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- users (profile mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: read own profile"
  on public.users for select using (auth.uid() = id);
create policy "users: insert own profile"
  on public.users for insert with check (auth.uid() = id);
create policy "users: update own profile"
  on public.users for update using (auth.uid() = id);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- clothes
-- ---------------------------------------------------------------------------
create table if not exists public.clothes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  category text not null check (category in
    ('top','bottom','dress','outerwear','shoes','accessory','other')),
  color text not null default 'black',
  secondary_colors text[] not null default '{}',
  pattern text not null default 'solid',
  material text not null default '',
  season text not null default 'all-season' check (season in
    ('summer','winter','monsoon','all-season')),
  styles text[] not null default '{}',
  formality text not null default 'casual' check (formality in
    ('casual','smart-casual','formal','athletic')),
  tags text[] not null default '{}',
  image_path text,                -- path inside the `wardrobe` storage bucket
  wear_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clothes_user_idx on public.clothes (user_id);

alter table public.clothes enable row level security;

create policy "clothes: read own"
  on public.clothes for select using (auth.uid() = user_id);
create policy "clothes: insert own"
  on public.clothes for insert with check (auth.uid() = user_id);
create policy "clothes: update own"
  on public.clothes for update using (auth.uid() = user_id);
create policy "clothes: delete own"
  on public.clothes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- outfits
-- ---------------------------------------------------------------------------
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  occasion text not null,
  vibe text not null,
  weather jsonb not null default '{}'::jsonb,   -- {tempC, condition, emoji, city}
  explanation text not null default '',
  tips text[] not null default '{}',
  vibe_match integer not null default 92,
  rating integer check (rating between 1 and 5),
  source text not null default 'ai' check (source in ('ai','stylist','surprise')),
  created_at timestamptz not null default now()
);

create index if not exists outfits_user_idx on public.outfits (user_id, created_at desc);

alter table public.outfits enable row level security;

create policy "outfits: read own"
  on public.outfits for select using (auth.uid() = user_id);
create policy "outfits: insert own"
  on public.outfits for insert with check (auth.uid() = user_id);
create policy "outfits: update own"
  on public.outfits for update using (auth.uid() = user_id);
create policy "outfits: delete own"
  on public.outfits for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- outfit_items (join table: which clothes make up an outfit)
-- ---------------------------------------------------------------------------
create table if not exists public.outfit_items (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  clothing_id uuid not null references public.clothes (id) on delete cascade,
  position integer not null default 0,
  unique (outfit_id, clothing_id)
);

alter table public.outfit_items enable row level security;

-- Access is derived from ownership of the parent outfit.
create policy "outfit_items: read own"
  on public.outfit_items for select using (
    exists (select 1 from public.outfits o
            where o.id = outfit_id and o.user_id = auth.uid()));
create policy "outfit_items: insert own"
  on public.outfit_items for insert with check (
    exists (select 1 from public.outfits o
            where o.id = outfit_id and o.user_id = auth.uid()));
create policy "outfit_items: delete own"
  on public.outfit_items for delete using (
    exists (select 1 from public.outfits o
            where o.id = outfit_id and o.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, outfit_id)
);

alter table public.favorites enable row level security;

create policy "favorites: read own"
  on public.favorites for select using (auth.uid() = user_id);
create policy "favorites: insert own"
  on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites: delete own"
  on public.favorites for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- style_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.style_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  favorite_colors text[] not null default '{}',
  preferred_vibes text[] not null default '{}',
  preferred_fit text not null default 'balanced' check (preferred_fit in
    ('oversized','fitted','balanced')),
  loves text not null default '',
  avoids text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.style_preferences enable row level security;

create policy "style_preferences: read own"
  on public.style_preferences for select using (auth.uid() = user_id);
create policy "style_preferences: upsert own"
  on public.style_preferences for insert with check (auth.uid() = user_id);
create policy "style_preferences: update own"
  on public.style_preferences for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private per-user wardrobe images
-- Bucket layout: wardrobe/{user_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', false)
on conflict (id) do nothing;

create policy "wardrobe images: read own"
  on storage.objects for select using (
    bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "wardrobe images: upload own"
  on storage.objects for insert with check (
    bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "wardrobe images: update own"
  on storage.objects for update using (
    bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "wardrobe images: delete own"
  on storage.objects for delete using (
    bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
