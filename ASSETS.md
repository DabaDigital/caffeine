# Supplied imagery

Brand and product imagery comes from the nine original PNGs in `public/`.
No generated replacements, stock photography, remote images or fabricated maps are used.
The redesigned hero adds one generated decorative coffee-bean cutout, documented below.
WebP copies preserve original composition and transparency; none are upscaled.

| Original filename suffix | Optimized asset | Usage |
| --- | --- | --- |
| 08_17_21 PM-1.png | hero-caffeine.webp | Hero, social sharing |
| 08_17_23 PM-2.png | iced-caramel.webp | Signature card, product detail, scroll composition |
| 08_17_25 PM-3.png | lotus-crepe.webp | Signature card, product detail, gallery, scroll composition |
| 08_17_27 PM-4.png | hot-coffee.webp | Signature card, product detail, scroll composition |
| 08_17_28 PM-5.png | storefront-cutout.webp | Social gallery |
| 08_17_30 PM-6.png | storefront.webp | Story, location |
| 08_17_31 PM-7.png | hand-coffee.webp | Story, social gallery |
| 08_17_33 PM-8.png | coffee-texture.webp | Scroll background, gallery |
| 08_17_35 PM-9.png | logo.webp | Header, footer, mobile navigation |
| image.png (supplied brand icon) | brand-mark.png | Story mark, source for favicon and app icons |

All optimized files live in `public/assets/`. The five starter SVGs are unused.

## Content intentionally left unconfigured

Menu, location, social, contact and review content is managed in the dashboard
(`/admin`) and stored in Supabase. The starting seed (`supabase/seed.sql`) holds
only the three photographed products, the Maarif location and the Instagram handle
from the supplied brief. Street address, phone, opening hours, a verified place
link, contact details and reviews stay empty until verified. The seeded prices
come from the visual mockup and are not treated as verified. The map action is
clearly labeled as a Google Maps search. No TikTok URL or online checkout is
assumed. Orders are explained as being placed in the café.

## Redesigned homepage

The experience at `/` reuses the same optimized photographs and the separately
supplied coffee-bean brand mark. `/ui-ux` redirects to `/`.
The location photograph links to Google Maps search; no map graphic is displayed.
The seed keeps the earlier display names and preview prices (45, 55 and 25 MAD)
and reuses the optimized product photographs; confirm the prices before
publishing. Photos uploaded in the dashboard are stored in the Supabase `media`
bucket. Unverified street address, opening hours, customer counts, and TikTok
links have not been added.

Set `NEXT_PUBLIC_SITE_URL` before the production build to enable the canonical URL.
Do not add LocalBusiness structured data until verified business details exist.

## Generated decorative asset

- File: `public/assets/floating-bean.webp` (280px wide, transparent WebP).
- Tool: built-in `image_gen`, generated October 3, 2026; resized and optimized with Sharp.
- Original retained at `C:/Users/keltoum/.codex/generated_images/01a10142-8947-7d82-8c18-776db49255f8/exec-05ddef6f-8124-4103-a662-e55edb692779.png`.
- Purpose: three decorative depth layers around the original Caffeine iced-coffee photograph.
- Prompt: "Use case: product-mockup. Create an isolated photorealistic single roasted coffee bean on a genuinely transparent background, no ground plane and no cast shadow. Rich dark espresso brown, oily subtle highlights, beautiful natural curved central crack. Single large bean viewed at a 3/4 angle with volumetric 3D depth, oriented diagonally bottom-left to top-right. Macro studio photography, warm soft side lighting. Entire object visible with 15 percent empty transparent padding around edges. No text, no other beans, no objects, no scenery. This is a decorative floating coffee bean asset for the Caffeine coffee shop website."

## Procedural 3D enhancement

`components/experience/CoffeeScene.tsx` builds five coffee beans from one shared,
grooved mesh in Three.js. The scene uses no external models, textures, or services.
The decorative bean WebP above is the fallback for reduced motion and browsers
without WebGL 2. The café and product photographs remain unchanged.
