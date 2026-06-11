alter table public.games
add column if not exists max_same_score_guesses integer
check (max_same_score_guesses is null or max_same_score_guesses > 0);

drop policy if exists "Public can read predictions" on public.predictions;

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
