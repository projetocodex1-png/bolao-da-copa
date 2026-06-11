alter table public.games
add column if not exists home_team_flag_url text;

alter table public.games
add column if not exists away_team_flag_url text;
