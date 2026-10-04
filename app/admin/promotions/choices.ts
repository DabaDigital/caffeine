import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PromotionProduct } from "@/components/admin/forms/PromotionForm";
import { rows } from "@/lib/admin";
import { cafeToday, shortDate } from "@/lib/site";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Products for the promotion form, each noting any other active promotion
 * that already includes it (a product can only be in one at a time).
 */
export async function promotionChoices(
  supabase: SupabaseClient<Database>,
  editing?: string,
): Promise<PromotionProduct[]> {
  const today = cafeToday();
  const [products, promotions] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, category:categories(name, icon)")
      .order("sort_order")
      .order("name")
      .then(rows),
    supabase
      .from("promotions")
      .select("id, title, starts_on, ends_on, promotion_products(product_id)")
      .eq("is_active", true)
      .or(`ends_on.is.null,ends_on.gte.${today}`)
      .then(rows),
  ]);

  const elsewhere = new Map<string, string>();
  for (const promotion of promotions) {
    if (promotion.id === editing) continue;
    const dates = promotion.ends_on
      ? `${shortDate(promotion.starts_on)}–${shortDate(promotion.ends_on)}`
      : `from ${shortDate(promotion.starts_on)}`;
    for (const { product_id } of promotion.promotion_products)
      if (!elsewhere.has(product_id))
        elsewhere.set(product_id, `In “${promotion.title}” ${dates}`);
  }

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category?.name ?? "",
    icon: product.category?.icon ?? "coffee",
    elsewhere: elsewhere.get(product.id) ?? null,
  }));
}
