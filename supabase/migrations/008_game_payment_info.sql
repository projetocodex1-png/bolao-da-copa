alter table public.games
add column if not exists entry_fee text;

alter table public.games
add column if not exists pix_info text;
