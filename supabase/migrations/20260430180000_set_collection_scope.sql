-- Collection scope: all printings vs regular booster cards only (no special art variants)

alter table public.user_set_collections
  add column if not exists collection_scope text not null default 'all_printings';

alter table public.user_set_collections
  drop constraint if exists user_set_collections_collection_scope_check;

alter table public.user_set_collections
  add constraint user_set_collections_collection_scope_check
  check (collection_scope in ('all_printings', 'regular_only'));

comment on column public.user_set_collections.collection_scope is
  'all_printings = every printing in the set; regular_only = standard booster cards without special art treatments';
