"use server";

import { invalid } from "@/lib/admin";
import type { FormState } from "@/lib/form-state";
import { createPublicClient } from "@/lib/supabase/public";
import { guestReviewSchema } from "@/lib/validation";

export type GuestReviewState = FormState & {
  /** The review is waiting for the team to approve it. */
  sent?: boolean;
};

const unavailable =
  "Your review couldn’t be sent just now. Please try again in a moment.";

/**
 * A review written on the homepage. The database files it as pending, and it
 * appears on the homepage only once an admin approves it in the dashboard.
 */
export async function submitReview(
  _state: GuestReviewState,
  formData: FormData,
): Promise<GuestReviewState> {
  // People never see the "website" field, but bots fill it in. They are
  // thanked like everyone else and nothing is saved.
  if (formData.get("website")) return { sent: true };

  const parsed = guestReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = createPublicClient();
  if (!supabase) return { message: unavailable };
  const { error } = await supabase.rpc("submit_review", parsed.data);
  if (error) {
    // Messages raised by the database function are written for guests.
    if (error.code === "P0001") return { message: error.message };
    console.error("Guest review not saved", error);
    return { message: unavailable };
  }
  return { sent: true };
}
