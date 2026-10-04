"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  databaseError,
  invalid,
  noticeUrl,
  parseToggle,
  revalidateContent,
} from "@/lib/admin";
import type { FormState } from "@/lib/form-state";
import { currency, formatPrice } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { id, promotionSchema } from "@/lib/validation";

export async function savePromotion(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const promotionId = formData.get("id")
    ? id.safeParse(formData.get("id"))
    : null;
  if (promotionId && !promotionId.success)
    return { message: "This promotion could not be found." };

  const parsed = promotionSchema.safeParse({
    ...Object.fromEntries(formData),
    product_ids: formData.getAll("product_ids"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const promotion = parsed.data;

  // An offer has to be cheaper than the regular prices.
  const supabase = await createClient();
  const { data: chosen, error: productError } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", promotion.product_ids);
  if (productError) return databaseError(productError);
  if (chosen.length !== promotion.product_ids.length)
    return invalid(undefined, {
      product_ids: "Some products no longer exist. Refresh and try again.",
    });
  const unpriced = chosen.filter((product) => product.price === null);
  if (unpriced.length)
    return invalid(undefined, {
      product_ids: `Give ${unpriced.map((product) => product.name).join(", ")} a price first.`,
    });
  const prices = chosen.map((product) => product.price ?? 0);
  if (promotion.discount_type === "amount") {
    const cheapest = Math.min(...prices);
    if (promotion.discount_value >= cheapest)
      return invalid(undefined, {
        discount_value: `Take off less than ${formatPrice(cheapest)} ${currency}, the lowest price selected.`,
      });
  }
  if (promotion.discount_type === "price") {
    const regular = prices.reduce((sum, price) => sum + price, 0);
    if (promotion.discount_value >= regular)
      return invalid(undefined, {
        discount_value: `Set a price below ${formatPrice(regular)} ${currency}, the regular price${chosen.length > 1 ? " of these products together" : ""}.`,
      });
  }

  // One transaction: the promotion and its products are saved together.
  const { error } = await supabase.rpc("save_promotion", {
    title: promotion.title,
    discount_type: promotion.discount_type,
    discount_value: promotion.discount_value,
    starts_on: promotion.starts_on,
    is_active: promotion.is_active,
    product_ids: promotion.product_ids,
    ...(promotionId ? { promotion_id: promotionId.data } : {}),
    ...(promotion.description ? { description: promotion.description } : {}),
    ...(promotion.ends_on ? { ends_on: promotion.ends_on } : {}),
  });
  if (error?.code === "P0001")
    // Raised by the database, e.g. a product already in another promotion.
    return invalid(undefined, { product_ids: error.message });
  if (error) return databaseError(error);

  revalidateContent("promotions");
  redirect(noticeUrl("/admin/promotions", promotionId ? "updated" : "created"));
}

export async function deletePromotion(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const promotionId = id.safeParse(formData.get("id"));
  if (!promotionId.success)
    return { message: "This promotion could not be found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId.data);
  if (error) return databaseError(error);

  revalidateContent("promotions");
  redirect(noticeUrl("/admin/promotions", "deleted"));
}

export async function togglePromotion(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_active"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: toggle.data.value })
    .eq("id", toggle.data.id);
  // Switching back on can clash with another promotion; say which.
  if (error?.code === "P0001") return { message: error.message };
  if (error) return databaseError(error);

  revalidateContent("promotions");
  return {};
}
