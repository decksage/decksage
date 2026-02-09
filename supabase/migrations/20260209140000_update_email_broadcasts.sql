-- Add new columns to email_broadcasts
alter table email_broadcasts 
add column if not exists resend_id text,
add column if not exists stats jsonb default '{}'::jsonb,
add column if not exists scheduled_for timestamptz,
add column if not exists updated_at timestamptz default now();

-- Create index for faster lookups
create index if not exists email_broadcasts_status_idx on email_broadcasts(status);
create index if not exists email_broadcasts_created_at_idx on email_broadcasts(created_at desc);
