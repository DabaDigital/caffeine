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
import { id, reviewSchema } from "@/lib/validation";

export async function saveReview(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const reviewId = formData.get("id") ? id.safeParse(formData.get("id")) : null;
  if (reviewId && !reviewId.success)
    return { message: "This review could not be found." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = reviewId
    ? await supabase
        .from("reviews")
        .update(parsed.data)
        .eq("id", reviewId.data)
        .select("id")
    : await supabase.from("reviews").insert(parsed.data).select("id");
  if (error) return databaseError(error);
  if (!data.length) return { message: "This review no longer exists." };

  revalidateContent("reviews");
  redirect(noticeUrl("/admin/reviews", reviewId ? "updated" : "created"));
}

export async function deleteReview(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const reviewId = id.safeParse(formData.get("id"));
  if (!reviewId.success) return { message: "This review could not be found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId.data);
  if (error) return databaseError(error);

  revalidateContent("reviews");
  redirect(noticeUrl("/admin/reviews", "deleted"));
}

export async function toggleReview(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_published"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_published: toggle.data.value })
    .eq("id", toggle.data.id);
  if (error) return databaseError(error);

  revalidateContent("reviews");
  return {};
}
