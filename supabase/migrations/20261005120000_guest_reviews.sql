-- Reviews written by guests on the homepage, approved or declined in the
-- dashboard.
--
-- status:
--   pending   written on the homepage, waiting for an admin
--   approved  shown on the homepage while is_published is on
--   declined  kept off the homepage; an admin can still approve it later
--
-- Reviews added in the dashboard are approved. Only approved reviews can be
-- published, so a guest's words never appear before an admin has read them.
-- Idempotent, like the earlier migrations: paste it into the SQL editor or
-- apply it with `supabase db push`.

-- Existing reviews were all added by admins, so they start approved.
alter table public.reviews
  add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'declined'));

do $$
begin
  alter table public.reviews
    add constraint reviews_published_only_when_approved
    check (status = 'approved' or not is_published);
exception
  when duplicate_object then null;
end
$$;

comment on column public.reviews.status is
  'pending (written on the homepage), approved or declined. Only approved reviews can be published.';

create index if not exists reviews_pending_idx
  on public.reviews (created_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Guests write reviews through this function only
-- ---------------------------------------------------------------------------

-- Visitors can't insert into reviews directly. This function files every
-- review as pending and unpublished, whatever the caller sends; the table's
-- checks still limit the name, rating and text.
create or replace function public.submit_review(
  author_name text,
  rating integer,
  comment text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A flood of submissions can't grow the waiting list without limit.
  if (select count(*) from public.reviews where status = 'pending') >= 100 then
    raise exception 'Our team has a lot of reviews to read right now. Please try again in a few days.'
      using errcode = 'P0001';
  end if;

  insert into public.reviews
    (author_name, rating, comment, source, reviewed_on, status, is_published)
  values
    (btrim(submit_review.author_name), submit_review.rating,
     btrim(submit_review.comment), 'Website',
     (now() at time zone 'Africa/Casablanca')::date, 'pending', false);
end;
$$;

revoke all on function public.submit_review(text, integer, text) from public;
grant execute on function public.submit_review(text, integer, text) to anon, authenticated;
