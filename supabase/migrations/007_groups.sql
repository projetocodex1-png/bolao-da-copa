create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.games
add column if not exists group_id uuid references public.groups(id) on delete set null;

create index if not exists games_group_datetime_idx on public.games (group_id, match_datetime);

drop trigger if exists groups_touch_updated_at on public.groups;
create trigger groups_touch_updated_at
before update on public.groups
for each row execute procedure public.touch_updated_at();

alter table public.groups enable row level security;

drop policy if exists "Public can read groups" on public.groups;
create policy "Public can read groups"
on public.groups for select
using (true);

drop policy if exists "Authenticated admins manage groups" on public.groups;
create policy "Authenticated admins manage groups"
on public.groups for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read visible games" on public.games;
create policy "Public can read visible games"
on public.games for select
using (status in ('soon', 'open', 'live', 'closed', 'finished') or auth.role() = 'authenticated');

drop policy if exists "Public can read predictions" on public.predictions;
create policy "Public can read predictions"
on public.predictions for select
using (
  exists (
    select 1
    from public.games
    where games.id = predictions.game_id
      and games.status in ('open', 'live', 'closed', 'finished')
  )
  or auth.role() = 'authenticated'
);
