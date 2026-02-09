-- Add blocks column to email_broadcasts for rich text persistence
alter table email_broadcasts 
add column if not exists blocks jsonb;
