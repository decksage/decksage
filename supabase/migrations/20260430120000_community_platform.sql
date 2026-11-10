-- Decksage community platform: feedback roadmap, NPS, onboarding, social layer, moderation, UGC, reputation

-- ---------------------------------------------------------------------------
-- Feedback roadmap (public items + votes)
-- ---------------------------------------------------------------------------
alter table public.feedback add column if not exists is_public boolean not null default false;

create table if not exists public.feedback_votes (
  user_id uuid not null references auth.users (id) on delete cascade,
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, feedback_id)
);

create index if not exists feedback_votes_feedback_id_idx on public.feedback_votes (feedback_id);

alter table public.feedback_votes enable row level security;

create policy "feedback_votes_insert_own"
  on public.feedback_votes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "feedback_votes_delete_own"
  on public.feedback_votes for delete to authenticated
  using (auth.uid() = user_id);

create policy "feedback_votes_select_authenticated"
  on public.feedback_votes for select to authenticated
  using (true);

-- Public can read votes for public roadmap items (aggregate counts)
create policy "feedback_votes_select_anon_public"
  on public.feedback_votes for select to anon
  using (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_id and f.is_public = true
    )
  );

-- Allow anyone to read public feedback rows (roadmap)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback' and policyname = 'Public read roadmap feedback'
  ) then
    create policy "Public read roadmap feedback" on public.feedback
      for select to anon, authenticated
      using (is_public = true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- NPS & onboarding
-- ---------------------------------------------------------------------------
create table if not exists public.nps_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score smallint not null check (score >= 0 and score <= 10),
  follow_up text,
  created_at timestamptz not null default now()
);

-- timestamptz + date_trunc is STABLE; AT TIME ZONE 'UTC' yields timestamp, then date_trunc is IMMUTABLE (required for indexes).
create unique index if not exists nps_responses_user_month_idx
  on public.nps_responses (user_id, (date_trunc('month', created_at at time zone 'UTC')));

alter table public.nps_responses enable row level security;

create policy "nps_insert_own" on public.nps_responses for insert to authenticated
  with check (auth.uid() = user_id);

create policy "nps_select_own" on public.nps_responses for select to authenticated
  using (auth.uid() = user_id);

create policy "nps_select_admin" on public.nps_responses for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.onboarding_answers enable row level security;

create policy "onboarding_insert_own" on public.onboarding_answers for insert to authenticated
  with check (auth.uid() = user_id);

create policy "onboarding_select_own" on public.onboarding_answers for select to authenticated
  using (auth.uid() = user_id);

create policy "onboarding_select_admin" on public.onboarding_answers for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Profile extensions
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists favorite_format text;
alter table public.profiles add column if not exists favorite_colors text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists onboarding_source text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists notification_digest text default 'off';
alter table public.profiles add column if not exists reputation_points int not null default 0;
alter table public.profiles add column if not exists reputation_level int not null default 1;
alter table public.profiles add column if not exists is_ambassador boolean not null default false;
alter table public.profiles add column if not exists ambassador_since timestamptz;

-- ---------------------------------------------------------------------------
-- Deck comments
-- ---------------------------------------------------------------------------
create table if not exists public.deck_comments (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.deck_comments (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists deck_comments_deck_id_idx on public.deck_comments (deck_id);
create index if not exists deck_comments_parent_id_idx on public.deck_comments (parent_id);

alter table public.deck_comments enable row level security;

create policy "deck_comments_select_visible"
  on public.deck_comments for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.decks d
      where d.id = deck_id and (d.is_public = true or d.user_id = auth.uid())
    )
  );

create policy "deck_comments_insert_auth_public_deck"
  on public.deck_comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.decks d
      where d.id = deck_id and d.is_public = true
    )
  );

create policy "deck_comments_update_own"
  on public.deck_comments for update to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create policy "deck_comments_admin_all"
  on public.deck_comments for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Post comments (blog)
-- ---------------------------------------------------------------------------
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.post_comments (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists post_comments_post_id_idx on public.post_comments (post_id);

alter table public.post_comments enable row level security;

create policy "post_comments_select_published"
  on public.post_comments for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.posts po
      where po.id = post_id and po.status = 'published'
    )
  );

create policy "post_comments_insert_auth"
  on public.post_comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts po where po.id = post_id and po.status = 'published')
  );

create policy "post_comments_update_own"
  on public.post_comments for update to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create policy "post_comments_admin_all"
  on public.post_comments for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Deck likes (saved_decks already exists for bookmarks)
-- ---------------------------------------------------------------------------
create table if not exists public.deck_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid not null references public.decks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

alter table public.deck_likes enable row level security;

create policy "deck_likes_select_all"
  on public.deck_likes for select to anon, authenticated using (true);

create policy "deck_likes_insert_own"
  on public.deck_likes for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.decks d where d.id = deck_id and d.is_public = true
    )
  );

create policy "deck_likes_delete_own"
  on public.deck_likes for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role / triggers insert via security definer function
create or replace function public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb default '{}'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_user_id = p_actor_id then
    return;
  end if;
  insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, payload)
  values (p_user_id, p_actor_id, p_type, p_entity_type, p_entity_id, coalesce(p_payload, '{}'::jsonb));
end;
$$;

create or replace function public.trg_deck_comment_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select d.user_id into owner_id from public.decks d where d.id = new.deck_id;
  perform public.create_notification(
    owner_id,
    new.user_id,
    'new_comment',
    'deck',
    new.deck_id,
    jsonb_build_object('comment_id', new.id)
  );
  if new.parent_id is not null then
    insert into public.notifications (user_id, actor_id, type, entity_type, entity_id, payload)
    select c.user_id, new.user_id, 'comment_reply', 'deck_comment', new.id,
           jsonb_build_object('deck_id', new.deck_id, 'parent_comment_id', new.parent_id)
    from public.deck_comments c
    where c.id = new.parent_id and c.user_id is distinct from new.user_id and c.user_id is distinct from owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_deck_comment_notify on public.deck_comments;
create trigger on_deck_comment_notify
  after insert on public.deck_comments
  for each row execute function public.trg_deck_comment_notify();

create or replace function public.trg_deck_like_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select d.user_id into owner_id from public.decks d where d.id = new.deck_id;
  perform public.create_notification(
    owner_id,
    new.user_id,
    'deck_liked',
    'deck',
    new.deck_id,
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_deck_like_notify on public.deck_likes;
create trigger on_deck_like_notify
  after insert on public.deck_likes
  for each row execute function public.trg_deck_like_notify();

-- ---------------------------------------------------------------------------
-- Follows
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "follows_select_all"
  on public.follows for select to authenticated using (true);

create policy "follows_insert_own"
  on public.follows for insert to authenticated
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete to authenticated
  using (auth.uid() = follower_id);

create or replace function public.trg_follow_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.followee_id,
    new.follower_id,
    'new_follower',
    'profile',
    new.follower_id,
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_follow_notify on public.follows;
create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.trg_follow_notify();

-- ---------------------------------------------------------------------------
-- Reports (moderation)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id)
);

create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

create policy "reports_insert_auth"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "reports_select_own"
  on public.reports for select to authenticated
  using (auth.uid() = reporter_id);

create policy "reports_admin_all"
  on public.reports for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Trending snapshot (filled by cron / API)
-- ---------------------------------------------------------------------------
create table if not exists public.trending_decks_weekly (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  deck_id uuid not null references public.decks (id) on delete cascade,
  format text,
  like_count int not null default 0,
  rank int not null default 0,
  unique (week_start, deck_id)
);

create index if not exists trending_week_start_idx on public.trending_decks_weekly (week_start desc);

alter table public.trending_decks_weekly enable row level security;

create policy "trending_select_all"
  on public.trending_decks_weekly for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Community publications (primers / tier lists)
-- ---------------------------------------------------------------------------
create table if not exists public.community_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text not null unique,
  publication_type text not null check (publication_type in ('primer', 'tier_list')),
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'published', 'rejected')),
  cover_image_url text,
  reviewer_note text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_publications_status_idx on public.community_publications (status);

alter table public.community_publications enable row level security;

create policy "community_pub_select_published"
  on public.community_publications for select to anon, authenticated
  using (status = 'published');

create policy "community_pub_select_own"
  on public.community_publications for select to authenticated
  using (auth.uid() = user_id);

create policy "community_pub_insert_own"
  on public.community_publications for insert to authenticated
  with check (auth.uid() = user_id);

create policy "community_pub_update_own_draft"
  on public.community_publications for update to authenticated
  using (auth.uid() = user_id and status in ('draft', 'rejected'))
  with check (auth.uid() = user_id);

create policy "community_pub_admin_all"
  on public.community_publications for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- User badges
-- ---------------------------------------------------------------------------
create table if not exists public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_code text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

alter table public.user_badges enable row level security;

create policy "user_badges_select_all"
  on public.user_badges for select to anon, authenticated using (true);

create policy "user_badges_admin_insert"
  on public.user_badges for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Allow system to grant via security definer later; for now admin only insert
-- ---------------------------------------------------------------------------
-- Deck of week / challenges (rituals)
-- ---------------------------------------------------------------------------
create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('deck_of_week', 'monthly_challenge', 'ama')),
  title text not null,
  description text,
  week_start date,
  month_start date,
  deck_id uuid references public.decks (id),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.community_events enable row level security;

create policy "community_events_select_all"
  on public.community_events for select to anon, authenticated using (true);

create policy "community_events_admin_write"
  on public.community_events for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Changelog category (optional seed)
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, slug)
select gen_random_uuid(), 'Atualizações do Produto', 'atualizacoes-do-produto'
where not exists (
  select 1 from public.categories c where c.slug = 'atualizacoes-do-produto'
);

-- Extend feedback details RPC with is_public (admin UI + roadmap)
create or replace function public.get_feedback_details(p_feedback_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'id', f.id,
    'status', f.status,
    'is_public', coalesce(f.is_public, false),
    'content', f.content,
    'created_at', f.created_at,
    'page_url', f.page_url,
    'user_agent', f.user_agent,
    'submitter_profile', case
        when f.user_id is not null then json_build_object('username', p.full_name, 'email', p.email)
        else json_build_object('username', f.user_name, 'email', f.user_email)
    end,
    'comments', (
      select coalesce(json_agg(json_build_object(
        'id', c.id,
        'created_at', c.created_at,
        'comment', c.comment,
        'admin_username', pa.full_name,
        'admin_avatar_url', pa.avatar_url
      ) order by c.created_at desc), '[]'::json)
      from public.feedback_comments c
      left join public.profiles pa on c.admin_id = pa.id
      where c.feedback_id = f.id
    )
  ) into result
  from public.feedback f
  left join public.profiles p on f.user_id = p.id
  where f.id = p_feedback_id;

  return result;
end;
$$;

-- Leaderboard: public deck counts by author (read-only, safe for anon)
create or replace function public.leaderboard_public_deck_counts(p_limit int default 30)
returns table (
  author_id uuid,
  display_name text,
  public_decks bigint,
  reputation_points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.user_id as author_id,
    coalesce(p.full_name, 'Jogador')::text as display_name,
    count(*)::bigint as public_decks,
    coalesce(p.reputation_points, 0)::int as reputation_points
  from public.decks d
  join public.profiles p on p.id = d.user_id
  where d.is_public = true
  group by d.user_id, p.full_name, p.reputation_points
  order by public_decks desc, reputation_points desc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.leaderboard_public_deck_counts(int) to anon, authenticated;
