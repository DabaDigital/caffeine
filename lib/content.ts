import "server-only";
import { displayableImage } from "@/lib/images";
import { placeMapEmbed } from "@/lib/maps";
import { contactHref, formatPhone } from "@/lib/phone";
import { parseHours } from "@/lib/validation";
import { createPublicClient } from "@/lib/supabase/public";
import {
  cafeToday,
  categoryIcons,
  contactTypes,
  discountTypes,
  discountedPrice,
  isOneOf,
  mapsSearchUrl,
  offerLabel,
  promotionTotals,
  socialPlatforms,
  type CategoryIcon,
  type ContactType,
  type SocialPlatform,
  type WeekHours,
} from "@/lib/site";

export type MenuCategory = {
  id: string;
  name: string;
  icon: CategoryIcon;
  /** Short line under the category title on the menu. */
  description: string | null;
};

export type MenuProduct = {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  categoryIcon: CategoryIcon;
  description: string;
  detail: string;
  image: string | null;
  price: number | null;
  badge: string | null;
  /** Large italic word behind the carousel photo. */
  highlight: string;
  tagline: string | null;
  ingredients: string[];
  /** Marked as a house favorite in the dashboard. */
  featured: boolean;
  /** A running promotion that lowers this product's own price. */
  offer: ProductOffer | null;
};

export type ProductOffer = {
  title: string;
  /** "-20%", "-10 MAD"… */
  label: string;
  price: number;
  /** Last day of the offer, "YYYY-MM-DD", or null when open-ended. */
  until: string | null;
};

/** A running promotion for the "Exclusive offers" section. */
export type SiteOffer = {
  id: string;
  title: string;
  description: string | null;
  label: string;
  until: string | null;
  /** Several products for one price. */
  bundle: boolean;
  /** Each product with its offer price (its regular price in bundles). */
  items: { product: MenuProduct; price: number; regular: number }[];
  regular: number;
  offer: number;
  saving: number;
};

export type SiteLocation = {
  id: string;
  name: string;
  area: string | null;
  city: string;
  address: string | null;
  /** Formatted for display, e.g. "+212 6 90 07 77 41". */
  phone: string | null;
  phoneHref: string | null;
  hours: WeekHours | null;
  hoursNote: string | null;
  mapUrl: string;
  /** True when no verified place link exists and mapUrl is a Maps search. */
  mapIsSearch: boolean;
  /** Google Maps embed pinned to the linked place; null without one. */
  mapEmbedUrl: string | null;
  image: string | null;
};

export type SiteSocialLink = {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
};

export type SiteContact = {
  id: string;
  type: ContactType;
  label: string | null;
  value: string;
  href: string;
};

export type SiteReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  source: string | null;
  date: string | null;
};

/** Totals across every published review, not only the ones listed. */
export type ReviewStats = {
  count: number;
  /** Mean rating from 1 to 5. */
  average: number;
  /** Reviews per rating, from 5 stars down to 1. */
  breakdown: { stars: number; count: number }[];
};

export type SiteContent = {
  categories: MenuCategory[];
  products: MenuProduct[];
  /** House favorites: featured products, or the first few when none are featured. */
  featured: MenuProduct[];
  locations: SiteLocation[];
  socials: SiteSocialLink[];
  contacts: SiteContact[];
  reviews: SiteReview[];
  /** Null until a review is published. */
  reviewStats: ReviewStats | null;
  offers: SiteOffer[];
};

const emptyContent: SiteContent = {
  categories: [],
  products: [],
  featured: [],
  locations: [],
  socials: [],
  contacts: [],
  reviews: [],
  reviewStats: null,
  offers: [],
};

const ratings = [5, 4, 3, 2, 1] as const;

/** Everything the homepage shows, as managed in the dashboard. */
export async function getSiteContent(): Promise<SiteContent> {
  const supabase = createPublicClient();
  if (!supabase) {
    console.warn(
      "Supabase is not configured; the homepage renders without menu data.",
    );
    return emptyContent;
  }

  const today = cafeToday();
  const [
    categories,
    products,
    locations,
    socials,
    contacts,
    reviews,
    ratingCounts,
    promotions,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon, description")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, details, price, image_url, badge, highlight_word, tagline, ingredients, is_featured",
      )
      .eq("is_available", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("locations")
      .select(
        "id, name, area, city, address, phone, hours, hours_note, map_url, image_url",
      )
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("social_links")
      .select("id, platform, label, url")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("contacts")
      .select("id, type, label, value")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("reviews")
      .select("id, author_name, rating, comment, source, reviewed_on")
      .eq("is_published", true)
      .order("reviewed_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12),
    // Exact totals per rating, so the summary counts every published review.
    // Head requests return only the count, no rows.
    Promise.all(
      ratings.map((stars) =>
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true)
          .eq("rating", stars),
      ),
    ),
    // Promotions running today, in Casablanca time.
    supabase
      .from("promotions")
      .select(
        "id, title, description, discount_type, discount_value, ends_on, promotion_products(product_id)",
      )
      .eq("is_active", true)
      .lte("starts_on", today)
      .or(`ends_on.is.null,ends_on.gte.${today}`)
      .order("ends_on", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const failure = [
    categories,
    products,
    locations,
    socials,
    contacts,
    reviews,
    ...ratingCounts,
  ].find((result) => result.error);
  // PGRST205: the tables don't exist yet because the migration hasn't run.
  if (failure?.error?.code === "PGRST205") {
    console.warn(
      "Supabase tables are missing. Run supabase/migrations/*.sql in the Supabase SQL editor.",
    );
    return emptyContent;
  }
  // Any other failure throws, so the last good cached homepage stays online
  // instead of being replaced by an empty one.
  if (failure?.error) {
    throw new Error(
      `Could not load homepage content from Supabase: ${failure.error.message}`,
    );
  }
  // Promotions come from a later migration; until it runs there are no offers.
  if (promotions.error && promotions.error.code !== "PGRST205") {
    throw new Error(
      `Could not load promotions from Supabase: ${promotions.error.message}`,
    );
  }

  const categoryById = new Map(
    (categories.data ?? []).map((category) => [
      category.id,
      {
        id: category.id,
        name: category.name,
        icon: isOneOf(categoryIcons, category.icon) ? category.icon : "coffee",
        description: category.description,
      } satisfies MenuCategory,
    ]),
  );

  const visible = (products.data ?? []).flatMap((product) => {
    // Products in a hidden category are hidden too.
    const category = categoryById.get(product.category_id);
    if (!category) return [];
    const item: MenuProduct = {
      id: product.id,
      name: product.name,
      categoryId: category.id,
      category: category.name,
      categoryIcon: category.icon,
      description: product.description ?? "",
      detail: product.details || product.description || "",
      image: displayableImage(product.image_url),
      price: product.price,
      badge: product.badge,
      highlight:
        product.highlight_word || `${category.name.toLocaleLowerCase()}.`,
      tagline: product.tagline,
      ingredients: product.ingredients,
      featured: product.is_featured,
      offer: null,
    };
    return [{ product: item, featured: product.is_featured }];
  });
  const menu = visible.map(({ product }) => product);
  const featured = visible
    .filter((item) => item.featured)
    .map(({ product }) => product);
  const offers = buildOffers(promotions.data ?? [], menu);
  // Maps are pinned from each location's own Maps link, never from a search.
  const mapEmbeds = await Promise.all(
    (locations.data ?? []).map((location) =>
      location.map_url ? placeMapEmbed(location.map_url) : null,
    ),
  );

  return {
    categories: [...categoryById.values()].filter((category) =>
      menu.some((product) => product.category === category.name),
    ),
    products: menu,
    featured: featured.length ? featured : menu.slice(0, 6),
    locations: (locations.data ?? []).map((location, index) => ({
      id: location.id,
      name: location.name,
      area: location.area,
      city: location.city,
      address: location.address,
      phone: location.phone ? formatPhone(location.phone) : null,
      phoneHref: location.phone ? contactHref("phone", location.phone) : null,
      hours: parseHours(location.hours),
      hoursNote: location.hours_note,
      mapUrl:
        location.map_url ??
        mapsSearchUrl(location.name, location.area, location.city),
      mapIsSearch: !location.map_url,
      mapEmbedUrl: mapEmbeds[index],
      image: displayableImage(location.image_url),
    })),
    socials: (socials.data ?? []).map((link) => ({
      id: link.id,
      platform: isOneOf(socialPlatforms, link.platform)
        ? link.platform
        : "website",
      label: link.label,
      url: link.url,
    })),
    contacts: (contacts.data ?? []).flatMap((contact) =>
      isOneOf(contactTypes, contact.type)
        ? [
            {
              id: contact.id,
              type: contact.type,
              label: contact.label,
              value:
                contact.type === "email"
                  ? contact.value
                  : formatPhone(contact.value),
              href: contactHref(contact.type, contact.value),
            },
          ]
        : [],
    ),
    reviews: (reviews.data ?? []).map((review) => ({
      id: review.id,
      author: review.author_name,
      rating: review.rating,
      comment: review.comment,
      source: review.source,
      date: review.reviewed_on,
    })),
    reviewStats: summarizeRatings(
      ratingCounts.map((result) => result.count ?? 0),
    ),
    offers,
  };
}

/** Average and breakdown from the number of reviews per rating (5 to 1). */
function summarizeRatings(counts: number[]): ReviewStats | null {
  const breakdown = ratings.map((stars, index) => ({
    stars,
    count: counts[index],
  }));
  const count = breakdown.reduce((total, row) => total + row.count, 0);
  if (!count) return null;
  const points = breakdown.reduce(
    (total, row) => total + row.stars * row.count,
    0,
  );
  return { count, average: points / count, breakdown };
}

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  ends_on: string | null;
  promotion_products: { product_id: string }[];
};

/**
 * Turns running promotions into homepage offers and gives each discounted
 * product its offer price. The database allows one running promotion per
 * product, so a product never has two competing prices.
 */
function buildOffers(promotions: PromotionRow[], menu: MenuProduct[]) {
  const byId = new Map(menu.map((product) => [product.id, product]));
  const offers: SiteOffer[] = [];
  for (const promotion of promotions) {
    if (!isOneOf(discountTypes, promotion.discount_type)) continue;
    const type = promotion.discount_type;
    const value = promotion.discount_value;
    const linked = promotion.promotion_products.map((link) => link.product_id);
    const items = linked
      .map((id) => byId.get(id))
      .filter(
        (product): product is MenuProduct & { price: number } =>
          product !== undefined && product.price !== null,
      );
    const bundle = type === "price" && linked.length > 1;
    // A bundle can only be bought when every product in it is on the menu.
    if (!items.length || (bundle && items.length !== linked.length)) continue;
    const totals = promotionTotals(
      type,
      value,
      items.map((product) => product.price),
    );
    // Prices may have changed since the promotion was saved.
    if (totals.saving <= 0) continue;
    const label = offerLabel(type, value, totals.regular, items.length);
    offers.push({
      id: promotion.id,
      title: promotion.title,
      description: promotion.description,
      label,
      until: promotion.ends_on,
      bundle,
      items: items.map((product) => ({
        product,
        price: bundle
          ? product.price
          : discountedPrice(type, value, product.price),
        regular: product.price,
      })),
      ...totals,
    });
    if (!bundle)
      for (const product of items)
        product.offer = {
          title: promotion.title,
          label,
          price: discountedPrice(type, value, product.price),
          until: promotion.ends_on,
        };
  }
  return offers;
}
