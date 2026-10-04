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
import { createClient } from "@/lib/supabase/server";
import { categorySchema, id } from "@/lib/validation";

export async function saveCategory(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const categoryId = formData.get("id")
    ? id.safeParse(formData.get("id"))
    : null;
  if (categoryId && !categoryId.success)
    return { message: "This category could not be found." };

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = categoryId
    ? await supabase
        .from("categories")
        .update(parsed.data)
        .eq("id", categoryId.data)
        .select("id")
    : await supabase.from("categories").insert(parsed.data).select("id");
  if (error?.code === "23505")
    return invalid(undefined, {
      name: "A category with this name already exists.",
    });
  if (error) return databaseError(error);
  if (!data.length) return { message: "This category no longer exists." };

  // Category names and visibility also change how products show on the site.
  revalidateContent("categories");
  revalidateContent("products");
  redirect(noticeUrl("/admin/categories", categoryId ? "updated" : "created"));
}

export async function deleteCategory(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const categoryId = id.safeParse(formData.get("id"));
  if (!categoryId.success)
    return { message: "This category could not be found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId.data);
  if (error)
    return databaseError(error, {
      "23503":
        "This category still has products. Move them to another category or delete them first.",
    });

  revalidateContent("categories");
  redirect(noticeUrl("/admin/categories", "deleted"));
}

export async function toggleCategory(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_active"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: toggle.data.value })
    .eq("id", toggle.data.id);
  if (error) return databaseError(error);

  revalidateContent("categories");
  revalidateContent("products");
  return {};
}
