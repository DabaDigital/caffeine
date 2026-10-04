-- Starting content: the menu, location and Instagram profile the homepage showed
-- before it was connected to the dashboard. Run once after the migration, then
-- manage everything from /admin. Prices come from the supplied design; confirm
-- them in the dashboard before publishing.
--
-- No reviews or contact details are seeded: none have been verified yet.

insert into public.categories (id, name, description, icon, sort_order)
values
  ('5d0f0e4c-58f4-4c2b-9a51-6f1f4a1c0001', 'Coffee', 'Espresso classics, hot or iced.', 'coffee', 1),
  ('5d0f0e4c-58f4-4c2b-9a51-6f1f4a1c0002', 'Crêpes', 'Golden crêpes with generous toppings.', 'sweet', 2)
on conflict (id) do nothing;

insert into public.products (
  id, category_id, name, description, details, price, image_url,
  badge, highlight_word, tagline, ingredients, is_featured, sort_order
)
values
  (
    '7b6f3d2a-1c9e-4f5a-8b7d-2e4c6a8f0001',
    '5d0f0e4c-58f4-4c2b-9a51-6f1f4a1c0001',
    'Iced Caramel Latte',
    'Rich espresso, fresh milk and a touch of caramel.',
    'Coffee, milk and caramel over ice. A little sweetness for your daily coffee ritual.',
    45,
    '/assets/iced-caramel.webp',
    'ICED & EASY',
    'chill.',
    'your daily pick-me-up.',
    array['Espresso', 'Silky milk', 'Caramel'],
    true,
    1
  ),
  (
    '7b6f3d2a-1c9e-4f5a-8b7d-2e4c6a8f0002',
    '5d0f0e4c-58f4-4c2b-9a51-6f1f4a1c0002',
    'Lotus Crêpe',
    'Our most loved crêpe, loaded with Lotus.',
    'A crêpe topped with Lotus biscuit crumbs and a generous sweet drizzle. Best enjoyed with your favorite coffee.',
    55,
    '/assets/lotus-crepe.webp',
    'JUST ONE MORE BITE',
    'sweet.',
    'a little sweet escape.',
    array['Golden crêpe', 'Lotus crunch', 'Chocolate'],
    true,
    2
  ),
  (
    '7b6f3d2a-1c9e-4f5a-8b7d-2e4c6a8f0003',
    '5d0f0e4c-58f4-4c2b-9a51-6f1f4a1c0001',
    'Hot Americano',
    'Pure coffee, pure focus.',
    'Rich espresso and hot water. A beautifully simple coffee, made for taking a moment.',
    25,
    '/assets/hot-coffee.webp',
    'SIMPLY GOOD COFFEE',
    'bold.',
    'the beauty of the everyday.',
    array['Rich espresso', 'Hot water', 'Big aroma'],
    true,
    3
  )
on conflict (id) do nothing;

-- Street address, phone and hours are left empty until verified. Without a
-- map link, the site opens a clearly labeled Google Maps search.
insert into public.locations (id, name, area, city, image_url, sort_order)
values (
  '9c1a7e5b-3d2f-4a6c-b8e1-0f2d4c6e0001',
  'Caffeine Maarif',
  'Maarif',
  'Casablanca',
  '/assets/storefront.webp',
  1
)
on conflict (id) do nothing;

insert into public.social_links (id, platform, label, url, sort_order)
values (
  'a3e5c7f9-2b4d-4e6f-8a1c-3e5f7a9b0001',
  'instagram',
  '@caffeinemaarif',
  'https://www.instagram.com/caffeinemaarif/',
  1
)
on conflict (id) do nothing;
