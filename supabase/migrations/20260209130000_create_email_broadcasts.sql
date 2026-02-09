create table if not exists email_broadcasts (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id),
  subject text not null,
  content text not null,
  recipient_count int default 0,
  status text default 'sent', -- 'sent', 'failed', 'draft' (if we add drafts later)
  created_at timestamptz default now()
);

-- RLS
alter table email_broadcasts enable row level security;

-- Policies
create policy "Enable all for admins" on email_broadcasts for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
