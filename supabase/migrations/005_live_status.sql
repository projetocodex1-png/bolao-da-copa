alter type public.game_status add value if not exists 'live';

update public.games
set status = 'live'
where status = 'open'
  and prediction_deadline <= now();
