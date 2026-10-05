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
import {
  id,
  reviewDecisionSchema,
  reviewSchema,
  reviewsDecisionSchema,
} from "@/lib/validation";

// The database only publishes approved reviews. Forms hide the switch for the
// others, so this only shows when someone else declined the review meanwhile.
const notApproved = {
  "23514":
    "This review isn't approved, so it can't be published. Approve it first.",
};

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
  if (error) return databaseError(error, notApproved);
  if (!data.length) return { message: "This review no longer exists." };

  revalidateContent("reviews");
  redirect(noticeUrl("/admin/reviews", reviewId ? "updated" : "created"));
}

// Approving publishes a review; declining keeps it off the homepage.
const decisions = {
  approve: { status: "approved", is_published: true },
  decline: { status: "declined", is_published: false },
} as const;

/** Approves or declines a guest's review from its own page. */
export async function moderateReview(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = reviewDecisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { message: "Couldn't update. Refresh and retry." };
  const { id: reviewId, decision } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .update(decisions[decision])
    .eq("id", reviewId)
    .select("id");
  if (error) return databaseError(error);
  if (!data.length) return { message: "This review no longer exists." };

  revalidateContent("reviews");
  redirect(
    noticeUrl(
      "/admin/reviews",
      decision === "approve" ? "approved" : "declined",
    ),
  );
}

/**
 * Approves or declines one review or several from the list. The list updates
 * where it is, so the page and scroll position stay put.
 */
export async function moderateReviews(
  ids: string[],
  decision: "approve" | "decline",
): Promise<FormState & { count?: number }> {
  await requireAdmin();
  const parsed = reviewsDecisionSchema.safeParse({ ids, decision });
  if (!parsed.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .update(decisions[parsed.data.decision])
    .in("id", parsed.data.ids)
    .select("id");
  if (error) return databaseError(error);
  if (!data.length)
    return { message: "These reviews no longer exist. Refresh the page." };

  revalidateContent("reviews");
  return { count: data.length };
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
  if (error) return databaseError(error, notApproved);

  revalidateContent("reviews");
  return {};
}
