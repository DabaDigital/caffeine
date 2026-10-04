-- Exclusive promotions on one or more products.
--
-- Discount types:
--   percent  X% off each selected product
--   amount   X MAD off each selected product
--   price    the selected products for X MAD: a special price for one product,
--            or a bundle price for several bought together
--
-- A product can be in only one active promotion for any given day, so the
-- price shown on the homepage is never ambiguous. Idempotent, like the first
-- migration: paste it into the SQL editor or apply it with `supabase db push`.

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text check (char_length(description) <= 300),
  discount_type text not null check (discount_type in ('percent', 'amount', 'price')),
  discount_value numeric(10, 2) not null
    check (discount_value > 0 and (discount_type <> 'percent' or discount_value <= 100)),
  starts_on date not null default current_date,
  ends_on date check (ends_on is null or ends_on >= starts_on),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_products (
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (promotion_id, product_id)
);

create index if not exists promotion_products_product_id_idx
  on public.promotion_products (product_id);

comment on column public.promotions.discount_value is
  'Percent off, MAD off, or the special/bundle price, depending on discount_type.';
comment on column public.promotions.ends_on is 'Last day of the offer; empty means no end date.';

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at
  before update on public.promotions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- One active promotion per product per day
-- ---------------------------------------------------------------------------

-- Title of another active promotion that shares the product on an
-- overlapping day, or null.
create or replace function private.promotion_conflict(target uuid, product uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select other.title
  from public.promotions this
  join public.promotion_products link on link.product_id = product
  join public.promotions other on other.id = link.promotion_id
  where this.id = target
    and other.id <> target
    and this.is_active
    and other.is_active
    and daterange(this.starts_on, this.ends_on, '[]')
      && daterange(other.starts_on, other.ends_on, '[]')
  order by other.starts_on
  limit 1;
$$;

revoke all on function private.promotion_conflict(uuid, uuid) from public;

create or replace function private.check_promotion_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conflict text;
  product_name text;
begin
  conflict := private.promotion_conflict(new.promotion_id, new.product_id);
  if conflict is not null then
    select name into product_name from public.products where id = new.product_id;
    raise exception '“%” is already in the promotion “%” on some of these dates.',
      product_name, conflict
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists promotion_products_exclusive on public.promotion_products;
create trigger promotion_products_exclusive
  before insert or update on public.promotion_products
  for each row execute function private.check_promotion_product();

-- Changing dates or switching a promotion back on must not create overlaps.
create or replace function private.check_promotion_dates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  conflict text;
begin
  for item in
    select link.product_id, product.name
    from public.promotion_products link
    join public.products product on product.id = link.product_id
    where link.promotion_id = new.id
  loop
    conflict := private.promotion_conflict(new.id, item.product_id);
    if conflict is not null then
      raise exception '“%” is already in the promotion “%” on some of these dates.',
        item.name, conflict
        using errcode = 'P0001';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists promotions_exclusive on public.promotions;
create trigger promotions_exclusive
  after update of starts_on, ends_on, is_active on public.promotions
  for each row execute function private.check_promotion_dates();

-- ---------------------------------------------------------------------------
-- Saving a promotion and its products in one transaction
-- ---------------------------------------------------------------------------

-- Runs as the caller, so row level security still decides who may save.
-- Leave promotion_id empty to create; description and ends_on are optional.
drop function if exists public.save_promotion(uuid, text, text, text, numeric, date, date, boolean, uuid[]);
create or replace function public.save_promotion(
  title text,
  discount_type text,
  discount_value numeric,
  starts_on date,
  is_active boolean,
  product_ids uuid[],
  promotion_id uuid default null,
  description text default null,
  ends_on date default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved uuid;
begin
  if coalesce(cardinality(product_ids), 0) = 0 then
    raise exception 'Choose at least one product.' using errcode = 'P0001';
  end if;

  if save_promotion.promotion_id is null then
    insert into public.promotions
      (title, description, discount_type, discount_value, starts_on, ends_on, is_active)
    values
      (save_promotion.title, save_promotion.description, save_promotion.discount_type,
       save_promotion.discount_value, save_promotion.starts_on, save_promotion.ends_on,
       save_promotion.is_active)
    returning id into saved;
  else
    -- Drop removed products first so they can't trigger false conflicts.
    delete from public.promotion_products link
    where link.promotion_id = save_promotion.promotion_id
      and link.product_id <> all (save_promotion.product_ids);

    update public.promotions promotion
    set title = save_promotion.title,
        description = save_promotion.description,
        discount_type = save_promotion.discount_type,
        discount_value = save_promotion.discount_value,
        starts_on = save_promotion.starts_on,
        ends_on = save_promotion.ends_on,
        is_active = save_promotion.is_active
    where promotion.id = save_promotion.promotion_id
    returning promotion.id into saved;

    if saved is null then
      raise exception 'This promotion no longer exists.' using errcode = 'P0001';
    end if;
  end if;

  insert into public.promotion_products (promotion_id, product_id)
  select saved, chosen
  from unnest(save_promotion.product_ids) as chosen
  on conflict do nothing;

  return saved;
end;
$$;

revoke all on function public.save_promotion(text, text, numeric, date, boolean, uuid[], uuid, text, date) from public, anon;
grant execute on function public.save_promotion(text, text, numeric, date, boolean, uuid[], uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Access: visitors read active promotions; only admins write
-- ---------------------------------------------------------------------------

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;

revoke all on table public.promotions, public.promotion_products from anon, authenticated;
grant select on table public.promotions, public.promotion_products to anon, authenticated;
grant insert, update, delete on table public.promotions, public.promotion_products to authenticated;

drop policy if exists "Anyone reads active promotions" on public.promotions;
create policy "Anyone reads active promotions"
  on public.promotions for select to anon, authenticated
  using (is_active or (select private.is_admin()));

drop policy if exists "Admins insert promotions" on public.promotions;
create policy "Admins insert promotions"
  on public.promotions for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "Admins update promotions" on public.promotions;
create policy "Admins update promotions"
  on public.promotions for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins delete promotions" on public.promotions;
create policy "Admins delete promotions"
  on public.promotions for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists "Anyone reads promotion products" on public.promotion_products;
create policy "Anyone reads promotion products"
  on public.promotion_products for select to anon, authenticated
  using (true);

drop policy if exists "Admins insert promotion products" on public.promotion_products;
create policy "Admins insert promotion products"
  on public.promotion_products for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "Admins update promotion products" on public.promotion_products;
create policy "Admins update promotion products"
  on public.promotion_products for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins delete promotion products" on public.promotion_products;
create policy "Admins delete promotion products"
  on public.promotion_products for delete to authenticated
  using ((select private.is_admin()));
