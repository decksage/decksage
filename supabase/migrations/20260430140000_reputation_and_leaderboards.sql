-- Increment reputation when a public deck receives a like (not self-like; create_notification already skips actor=owner edge cases for notify)
create or replace function public.trg_rep_on_deck_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select d.user_id into owner_id from public.decks d where d.id = new.deck_id;
  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;
  update public.profiles p
  set reputation_points = p.reputation_points + 1
  where p.id = owner_id;
  return new;
end;
$$;

drop trigger if exists on_deck_like_reputation on public.deck_likes;
create trigger on_deck_like_reputation
  after insert on public.deck_likes
  for each row execute function public.trg_rep_on_deck_like();

-- Monthly comment leaderboard (UTC month)
create or replace function public.leaderboard_monthly_commenters(p_limit int default 30)
returns table (
  user_id uuid,
  display_name text,
  comment_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.user_id,
    coalesce(p.full_name, p.username, 'Jogador')::text as display_name,
    count(*)::bigint as comment_count
  from public.deck_comments c
  join public.profiles p on p.id = c.user_id
  where c.deleted_at is null
    and c.created_at >= date_trunc('month', timezone('utc', now()))
  group by c.user_id, p.full_name, p.username
  order by comment_count desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

grant execute on function public.leaderboard_monthly_commenters(int) to anon, authenticated;
