-- Flag each linked card as regular booster art vs special treatment

alter table public.user_set_collection_cards
  add column if not exists is_regular boolean;

create index if not exists user_set_collection_cards_regular_idx
  on public.user_set_collection_cards (collection_id, is_regular);
