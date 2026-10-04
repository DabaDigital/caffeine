"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  databaseError,
  invalid,
  noticeUrl,
  parseToggle,
  readImage,
  removeImage,
  resolveImage,
  revalidateContent,
} from "@/lib/admin";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { id, productSchema } from "@/lib/validation";

export async function saveProduct(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const productId = formData.get("id")
    ? id.safeParse(formData.get("id"))
    : null;
  if (productId && !productId.success)
    return { message: "This product could not be found." };

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  const imageCheck = readImage(formData);
  if (!parsed.success || imageCheck.error)
    return invalid(parsed.error, { image: imageCheck.error });

  const supabase = await createClient();
  let current: string | null = null;
  if (productId) {
    const { data, error } = await supabase
      .from("products")
      .select("image_url")
      .eq("id", productId.data)
      .maybeSingle();
    if (error) return databaseError(error);
    if (!data) return { message: "This product no longer exists." };
    current = data.image_url;
  }

  const image = await resolveImage(supabase, formData, "products", current);
  if ("error" in image) return invalid(undefined, { image: image.error });

  const values = { ...parsed.data, image_url: image.url };
  const { error } = productId
    ? await supabase.from("products").update(values).eq("id", productId.data)
    : await supabase.from("products").insert(values);
  if (error) {
    await image.rollback();
    return databaseError(error, {
      "23503": "That category no longer exists. Choose another one.",
    });
  }
  await image.commit();

  revalidateContent("products");
  redirect(noticeUrl("/admin/products", productId ? "updated" : "created"));
}

export async function deleteProduct(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const productId = id.safeParse(formData.get("id"));
  if (!productId.success)
    return { message: "This product could not be found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId.data)
    .select("image_url")
    .maybeSingle();
  if (error) return databaseError(error);
  if (data) await removeImage(supabase, data.image_url);

  revalidateContent("products");
  redirect(noticeUrl("/admin/products", "deleted"));
}

export async function toggleProduct(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_available", "is_featured"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };
  const { id: productId, field, value } = toggle.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(
      field === "is_available"
        ? { is_available: value }
        : { is_featured: value },
    )
    .eq("id", productId);
  if (error) return databaseError(error);

  revalidateContent("products");
  return {};
}
