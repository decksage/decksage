-- Enable public read access for ad_slots
alter table "public"."ad_slots" enable row level security;

create policy "Enable read access for all users"
on "public"."ad_slots"
as permissive
for select
to public
using (true);
