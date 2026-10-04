-- Opening hours by day, shown like Google Maps.
--
-- `hours` holds the weekly schedule, one list of periods per day:
--   {"mon": [{"open": "07:30", "close": "21:45"}], ..., "sun": []}
-- An empty list means closed that day. A close time at or before the open time
-- runs past midnight (e.g. 18:00 to 01:00). Null means hours aren't published.
-- The earlier free-text column is kept as an optional note under the hours.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'locations' and column_name = 'opening_hours'
  ) then
    alter table public.locations rename column opening_hours to hours_note;
  end if;
end
$$;

alter table public.locations
  add column if not exists hours jsonb
  check (hours is null or jsonb_typeof(hours) = 'object');

comment on column public.locations.hours is
  'Weekly schedule: {"mon": [{"open": "07:30", "close": "21:45"}], ...}; [] means closed.';
comment on column public.locations.hours_note is
  'Optional note under the hours, e.g. "Hours may differ during Ramadan".';
