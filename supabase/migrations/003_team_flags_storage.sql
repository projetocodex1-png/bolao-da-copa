insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-flags',
  'team-flags',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read team flags" on storage.objects;
drop policy if exists "Authenticated admins can upload team flags" on storage.objects;
drop policy if exists "Authenticated admins can update team flags" on storage.objects;
drop policy if exists "Authenticated admins can delete team flags" on storage.objects;

create policy "Public can read team flags"
on storage.objects for select
using (bucket_id = 'team-flags');

create policy "Authenticated admins can upload team flags"
on storage.objects for insert
to authenticated
with check (bucket_id = 'team-flags');

create policy "Authenticated admins can update team flags"
on storage.objects for update
to authenticated
using (bucket_id = 'team-flags')
with check (bucket_id = 'team-flags');

create policy "Authenticated admins can delete team flags"
on storage.objects for delete
to authenticated
using (bucket_id = 'team-flags');
