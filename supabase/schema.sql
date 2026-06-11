create extension if not exists pgcrypto;

do $$
begin
  create type public.game_status as enum ('draft', 'open', 'closed', 'finished');
exception
  when duplicate_object then null;
end
$$;

alter type public.game_status add value if not exists 'archived';

create table public.games (
  id uuid primary key default gen_random_uuid(),
  home_team text not null check (length(trim(home_team)) > 0),
  home_team_flag_url text,
  away_team text not null check (length(trim(away_team)) > 0),
  away_team_flag_url text,
  phase text not null default 'Fase de grupos',
  match_datetime timestamptz not null,
  prediction_deadline timestamptz not null,
  status public.game_status not null default 'draft',
  max_same_score_guesses integer check (max_same_score_guesses is null or max_same_score_guesses > 0),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team <> away_team),
  check (
    (status <> 'finished' and home_score is null and away_score is null)
    or (status = 'finished' and home_score is not null and away_score is not null)
  )
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  participant_name text not null check (length(trim(participant_name)) between 2 and 60),
  home_score_guess integer not null check (home_score_guess between 0 and 99),
  away_score_guess integer not null check (away_score_guess between 0 and 99),
  ip_hash text,
  created_at timestamptz not null default now()
);

create unique index predictions_unique_name_per_game
on public.predictions (game_id, lower(trim(participant_name)));

create index predictions_game_created_at_idx on public.predictions (game_id, created_at);
create index games_status_datetime_idx on public.games (status, match_datetime);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_touch_updated_at
before update on public.games
for each row execute procedure public.touch_updated_at();

create or replace function public.predictions_are_open(target_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.games
    where id = target_game_id
      and status = 'open'
      and prediction_deadline > now()
  );
$$;

alter table public.games enable row level security;
alter table public.predictions enable row level security;

create policy "Public can read visible games"
on public.games for select
using (status in ('open', 'closed', 'finished') or auth.role() = 'authenticated');

create policy "Authenticated admins manage games"
on public.games for all
to authenticated
using (true)
with check (true);

create policy "Public can read predictions"
on public.predictions for select
using (
  exists (
    select 1
    from public.games
    where games.id = predictions.game_id
      and games.status in ('open', 'closed', 'finished')
  )
  or auth.role() = 'authenticated'
);

create policy "Public can insert open predictions"
on public.predictions for insert
with check (public.predictions_are_open(game_id));

create policy "Authenticated admins manage predictions"
on public.predictions for all
to authenticated
using (true)
with check (true);
