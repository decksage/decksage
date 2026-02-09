-- Add role column to profiles if it doesn't exist
alter table profiles add column if not exists role text default 'user';

-- Create feedback table
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  feedback_type text not null,
  status text not null default 'new',
  page_url text,
  user_agent text,
  user_id uuid references auth.users(id),
  user_email text,
  user_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create feedback_comments table
create table if not exists feedback_comments (
  id uuid default gen_random_uuid() primary key,
  feedback_id uuid references feedback(id) on delete cascade,
  admin_id uuid references auth.users(id),
  comment text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists feedback_user_id_idx on feedback(user_id);
create index if not exists feedback_comments_feedback_id_idx on feedback_comments(feedback_id);

-- RLS
alter table feedback enable row level security;
alter table feedback_comments enable row level security;

-- Policies for feedback
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Enable insert for everyone' and tablename = 'feedback') then
        create policy "Enable insert for everyone" on feedback for insert with check (true);
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Enable read for admins' and tablename = 'feedback') then
        create policy "Enable read for admins" on "public"."feedback" as PERMISSIVE for SELECT to public using (
          (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
        );
    end if;
    
    if not exists (select 1 from pg_policies where policyname = 'Enable update for admins' and tablename = 'feedback') then
        create policy "Enable update for admins" on "public"."feedback" as PERMISSIVE for UPDATE to public using (
          (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
        );
    end if;
    
    if not exists (select 1 from pg_policies where policyname = 'Enable delete for admins' and tablename = 'feedback') then
        create policy "Enable delete for admins" on "public"."feedback" as PERMISSIVE for DELETE to public using (
          (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
        );
    end if;
end
$$;

do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Enable all for admins' and tablename = 'feedback_comments') then
        create policy "Enable all for admins" on "public"."feedback_comments" as PERMISSIVE for ALL to public using (
          (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))
        );
    end if;
end
$$;

-- RPC: get_feedback_details
drop function if exists get_feedback_details(uuid);
create or replace function get_feedback_details(p_feedback_id uuid)
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
      from feedback_comments c
      left join profiles pa on c.admin_id = pa.id
      where c.feedback_id = f.id
    )
  ) into result
  from feedback f
  left join profiles p on f.user_id = p.id
  where f.id = p_feedback_id;

  return result;
end;
$$;

-- RPC: search_feedback_paginated
drop function if exists search_feedback_paginated(text, int, int);
create or replace function search_feedback_paginated(search_term text, page_size int, page_offset int)
returns table (
  id uuid,
  content text,
  status text,
  username text,
  email text,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with filtered_feedback as (
    select 
      f.id,
      f.content,
      f.status,
      p.full_name as username,
      coalesce(p.email, f.user_email) as email,
      f.created_at,
      count(*) over() as total_count
    from feedback f
    left join profiles p on f.user_id = p.id
    where 
      (search_term is null or search_term = '' or 
       f.content ilike '%' || search_term || '%' or
       p.email ilike '%' || search_term || '%' or
       f.user_email ilike '%' || search_term || '%')
  )
  select * from filtered_feedback
  order by created_at desc
  limit page_size offset page_offset;
end;
$$;
