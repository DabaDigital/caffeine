"use client";

import {
  AdminForm,
  DateField,
  Fields,
  FormSection,
  RatingField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/form";
import { saveReview } from "@/app/admin/reviews/actions";
import type { Tables } from "@/lib/supabase/database.types";

type Review = Pick<
  Tables<"reviews">,
  | "id"
  | "author_name"
  | "rating"
  | "comment"
  | "source"
  | "reviewed_on"
  | "is_published"
  | "status"
>;

export function ReviewForm({
  review,
  today,
}: {
  review?: Review;
  today: string;
}) {
  return (
    <AdminForm
      action={saveReview}
      submitLabel={review ? "Save changes" : "Add review"}
      cancelHref="/admin/reviews"
    >
      {review && <input type="hidden" name="id" value={review.id} />}
      <FormSection
        title="Review"
        description="Copy a real review word for word, for example from Google Maps, and say where it came from."
      >
        <RatingField defaultValue={review?.rating ?? 5} />
        <Fields>
          <TextAreaField
            name="comment"
            label="Review"
            wide
            rows={4}
            maxLength={1000}
            defaultValue={review?.comment ?? ""}
          />
          <TextField
            name="author_name"
            label="Guest name"
            maxLength={80}
            defaultValue={review?.author_name ?? ""}
            placeholder="Salma B."
          />
          <TextField
            name="source"
            label="Source"
            optional
            maxLength={40}
            defaultValue={review?.source ?? ""}
            placeholder="Google"
          />
          <DateField
            name="reviewed_on"
            label="Date"
            optional
            max={today}
            defaultValue={review?.reviewed_on ?? ""}
            placeholder="When was it written?"
          />
        </Fields>
        {/* Guests' reviews are published by approving them. */}
        {(!review || review.status === "approved") && (
          <ToggleField
            name="is_published"
            label="Published"
            description="Published reviews appear on the homepage."
            defaultChecked={review?.is_published ?? true}
          />
        )}
      </FormSection>
    </AdminForm>
  );
}
