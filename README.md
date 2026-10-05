# Caffeine — Coffee & Tea House

A mobile-first Next.js 16 café experience with espresso, pistachio, and cream
colors, expressive serif typography, and a full menu that stays easy to browse
as it grows.
GSAP drives floating products, masked text entrances, scroll reveals, word animation,
and photo parallax. Three.js renders softly lit, rotating coffee beans around the
original product photography. Motion respects reduced-motion preferences and can
be paused in the header.

The design lives at `/`; `/ui-ux` redirects to it. The header pairs the supplied
coffee-bean brand mark with the Caffeine wordmark. That icon also appears in the
story section and is used for the favicon, app icon, and Apple touch icon.
Active components and scoped styles live in `components/experience/`.
Everything the homepage lists (products, prices, categories, locations, social
links, contact details and reviews) comes from the Supabase dashboard at
`/admin`; nothing is hardcoded.

The menu opens with the house favorites (featured products that have a photo),
then lists every product by category. Search matches names, descriptions and
ingredients, with or without accents. The category links follow the scroll: a
sticky rail on phones, a side index from 1024px. A category shows a photo column
once a third of its products have photos; JPEG photos fill their frame, while
transparent PNG or WebP cutouts float in it. Reviews show the average and
breakdown of every published review, a featured quote and the latest twelve;
until one is published, the section invites guests to write the first. Guests
write reviews with “Write a review” (or on Google Maps); theirs appear once an
admin approves them.

## Dashboard

Only accounts with the `admin` role can open `/admin`. Each section (products,
categories, promotions, locations, social links, contact, reviews, team & roles)
has its own list, add and edit pages, with loading skeletons shaped like each page.

- **Promotions**: exclusive offers on one product or several, as a percentage
  off, an amount off, a special price (one product) or a bundle price (several).
  A product can only be in one active promotion on any day; the database
  refuses overlaps and names the clashing promotion. Running offers appear in
  the homepage “Exclusive offers” section and lower the menu prices.
- **Opening hours**: edited day by day like Google Maps (open or closed, up to
  three periods, closing after midnight allowed, copy Monday to every day). The
  homepage shows “Open now · Closes 9:45 PM”, worked out in the visitor's
  browser in Casablanca time, and expands to the week.
- **Phone numbers**: entered with a country picker (Morocco by default) and
  checked with `libphonenumber-js`; they are stored as `+212…` and shown as
  `+212 6 12 34 56 78`.
- **Guest reviews**: reviews written on the homepage wait in Reviews under the
  “Waiting for approval” tab, which opens first while any are waiting. Each row
  has Approve (publishes it) and Decline (keeps it off the homepage; it can
  still be approved later); tick several, or every waiting review, to decide
  them at once. The list updates in place. Visitors can only file pending
  reviews (through the `submit_review` database function, which also caps the
  waiting list at 100), and only approved reviews can be published. Reviews
  added in the dashboard are approved.

### Setup

1. Put the project URL and publishable key in `.env.local` (see `.env.example`).
   Both are needed at build time.
2. In the Supabase SQL editor, run the files in `supabase/migrations` in order
   (`…_caffeine_dashboard.sql`, `…_promotions.sql`, `…_location_hours.sql`,
   `…_guest_reviews.sql`), then optionally `supabase/seed.sql` for the starting
   menu. Each migration is safe to run twice. The seed prices (45, 55 and 25
   MAD) come from the supplied design: confirm them in the dashboard.
3. Create your account in Authentication → Users → Add user (tick “Auto Confirm
   User”), then promote it in the SQL editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

4. Sign in at `/login`. Further admins are promoted from Team & roles.
5. Recommended: since staff accounts are created by an admin, turn off public
   sign-ups in Authentication → Sign In / Providers.

### How access is enforced

- `profiles.role` is `admin` or `user`; new accounts are `user` and see “no access”.
- Row level security lets anyone read visible rows and only admins write. The
  last admin can't be demoted, and admins can't change their own role.
- `proxy.ts` refreshes the session on `/admin` and `/login`; every dashboard page
  and Server Action re-checks the role, and the database checks it again.
- Photos go to the public `media` storage bucket (admin-only uploads, 5 MB,
  JPG/PNG/WebP/AVIF). Replaced or deleted photos are removed from storage.
- The homepage is static. Saving in the dashboard refreshes it immediately;
  edits made directly in Supabase appear within a minute.

### Local Supabase (optional)

With Docker running, `npx supabase start` then `npx supabase db reset` starts a
local stack with the migration and seed. Use the URL and publishable key it
prints. After schema changes, regenerate types with
`npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts`.

## Run

```sh
npm install
npm run dev
```

Production and verification:

```sh
npm run build
npm run start
npm run lint
npm test
```

The Playwright suite uses installed Microsoft Edge and an isolated production
server on port 3002 (override with `PLAYWRIGHT_PORT`). Build before running it. It checks eight viewport widths,
menu search, category links and product details, the reviews section, mobile
navigation and focus, reduced motion, image loading, animation controls, and
automated WCAG accessibility. It also checks 44px mobile header controls,
the mobile navigation dock, WebGL rendering, and live reduced-motion changes.

Homepage tests read whatever the dashboard publishes; menu tests skip until
products are published. Dashboard tests check the login
redirect; set `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` to also run the signed-in
checks, which only read data and never save.

The 3D scene loads separately, caps pixel density at 1.5 and rendering at 30 fps,
and suspends drawing when offscreen, paused, or in a hidden tab. Static coffee-bean
images remain available when WebGL is unavailable or reduced motion is requested.

## Content

- `app/admin/`: dashboard pages and Server Actions, one folder per section.
- `components/admin/`: dashboard UI, forms and skeletons.
- `components/ui/`: reusable, accessible form controls: `Select` and
  `MultiSelect` (searchable dropdowns with icons), `DatePicker`, `PhoneInput`
  and `HoursEditor`. Each submits through hidden inputs, so it works in any form.
- `lib/content.ts`: loads the homepage content from Supabase.
- `lib/supabase/`: Supabase clients, session proxy and generated types.
- `supabase/`: migration (schema, roles, RLS, storage) and starting seed.
- `data/brand.ts`: local brand photography paths used by the homepage.
- `ASSETS.md`: complete mapping from supplied PNGs to optimized WebP copies.
- `components/experience/`: the active homepage, interactions, GSAP motion, and scoped styles;
  `MenuBrowser.tsx` is the menu and `Reviews.tsx` the reviews section.
- `components/menu/MenuProvider.tsx`: menu filters, search and native dialogs.
- `components/design/`, `components/home/`, `components/layout/`, `data/menu.ts`:
  retained earlier designs. No route renders them.

Brand photography is supplied locally. A generated transparent coffee bean is used
as the 3D scene's fallback; its prompt and provenance are in `ASSETS.md`. The original
PNGs remain intact. The homepage does not invent ratings, business hours, or map
screenshots: reviews, hours and contact details appear only once added in the
dashboard, and without a Maps link a location opens a Google Maps search.

## Before publishing

Set `NEXT_PUBLIC_SITE_URL` to the final origin, then build again to emit the
correct canonical and social URLs. Local preview uses localhost.

Add the verified address, hours, phone and Google Maps link in Dashboard →
Locations. Until then the map link is an explicitly labeled business search.
Confirm the seeded prices in Dashboard → Products. Online ordering has not been
connected: the order button clearly explains that orders are placed in the café.

Native dialogs support Escape, focus containment and focus restoration. The page
remains readable with JavaScript disabled; motion never gates the initial HTML.

# Google Maps reviews

Set `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` in `.env.local` and in the hosting environment. The key stays on the server; restrict it to Places API (New) and rotate exposed keys. Restart the development server after changing these variables.

The reviews section requests live Google data through `/api/google-reviews`. Requests are not persistently cached or saved to Supabase. Each page visit can generate a billable Place Details request. Configure Google Cloud quotas for the expected traffic before deployment.

Google may return the overall rating and count without review text. The section always retains the Supabase guest reviews and their separate guest-book summary. Google ratings and counts appear alongside them without combining totals or inventing a rating distribution. When Google returns written reviews, they appear in a separate attributed group, preserving relevance order and author/source links. API failures leave the guest reviews available.

Before publishing, provide the public Terms of Use and Privacy Policy required by Google's Places API policies: https://developers.google.com/maps/documentation/places/web-service/policies.

The live integration check is opt-in with `TEST_GOOGLE_PLACES_LIVE=1`; other Google review tests use mocked responses.
