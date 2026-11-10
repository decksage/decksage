-- User set collections: track ownership of cards in a specific MTG edition,
-- with per-finish quantities (nonfoil, foil, etched, etc.).

-- ---------------------------------------------------------------------------
-- Collections (one per user + set_code)
-- ---------------------------------------------------------------------------
create table if not exists public.user_set_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  set_code text not null,
  set_name text not null,
  set_icon_svg_uri text,
  released_at date,
  is_public boolean not null default false,
  total_cards int not null default 0,
  owned_cards int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, set_code)
);

create index if not exists user_set_collections_user_id_idx
  on public.user_set_collections (user_id);

create index if not exists user_set_collections_public_idx
  on public.user_set_collections (is_public)
  where is_public = true;

alter table public.user_set_collections enable row level security;

create policy "user_set_collections_select_own"
  on public.user_set_collections for select to authenticated
  using (auth.uid() = user_id);

create policy "user_set_collections_select_public"
  on public.user_set_collections for select to anon, authenticated
  using (is_public = true);

create policy "user_set_collections_insert_own"
  on public.user_set_collections for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_set_collections_update_own"
  on public.user_set_collections for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_set_collections_delete_own"
  on public.user_set_collections for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Cards linked to a set collection (all printings from the edition)
-- quantities jsonb example: {"nonfoil": 2, "foil": 1, "etched": 0}
-- ---------------------------------------------------------------------------
create table if not exists public.user_set_collection_cards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.user_set_collections (id) on delete cascade,
  card_scryfall_id text not null,
  card_name text not null,
  collector_number text not null,
  rarity text,
  mana_cost text,
  type_line text,
  colors text[] default '{}',
  image_url text,
  available_finishes text[] not null default '{}',
  quantities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, card_scryfall_id)
);

create index if not exists user_set_collection_cards_collection_id_idx
  on public.user_set_collection_cards (collection_id);

create index if not exists user_set_collection_cards_name_idx
  on public.user_set_collection_cards (collection_id, card_name);

alter table public.user_set_collection_cards enable row level security;

create policy "user_set_collection_cards_select_own"
  on public.user_set_collection_cards for select to authenticated
  using (
    exists (
      select 1 from public.user_set_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "user_set_collection_cards_select_public"
  on public.user_set_collection_cards for select to anon, authenticated
  using (
    exists (
      select 1 from public.user_set_collections c
      where c.id = collection_id and c.is_public = true
    )
  );

create policy "user_set_collection_cards_insert_own"
  on public.user_set_collection_cards for insert to authenticated
  with check (
    exists (
      select 1 from public.user_set_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "user_set_collection_cards_update_own"
  on public.user_set_collection_cards for update to authenticated
  using (
    exists (
      select 1 from public.user_set_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_set_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "user_set_collection_cards_delete_own"
  on public.user_set_collection_cards for delete to authenticated
  using (
    exists (
      select 1 from public.user_set_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Keep owned_cards in sync when quantities change
-- ---------------------------------------------------------------------------
create or replace function public.refresh_user_set_collection_owned_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  coll_id uuid;
begin
  coll_id := coalesce(new.collection_id, old.collection_id);

  update public.user_set_collections
  set
    owned_cards = (
      select count(*)::int
      from public.user_set_collection_cards c
      where c.collection_id = coll_id
        and exists (
          select 1
          from jsonb_each_text(c.quantities) as kv(finish, qty)
          where nullif(kv.qty, '')::int > 0
        )
    ),
    updated_at = now()
  where id = coll_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_set_collection_owned on public.user_set_collection_cards;
create trigger trg_refresh_set_collection_owned
  after update of quantities or delete
  on public.user_set_collection_cards
  for each row
  execute function public.refresh_user_set_collection_owned_count();
