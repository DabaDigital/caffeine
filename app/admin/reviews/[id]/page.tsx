import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton, ReviewDecision } from "@/components/admin/controls";
import { ReviewForm } from "@/components/admin/forms/ReviewForm";
import { requireAdmin } from "@/lib/auth";
import { isOneOf, reviewStatuses, type ReviewStatus } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteReview, moderateReview } from "../actions";

export const metadata: Metadata = { title: "Edit review" };

const deleteNotes: Record<ReviewStatus, string> = {
  approved:
    "It disappears from the homepage. To hide it temporarily, switch off “Published” instead.",
  pending:
    "Use this for spam: it is gone for good. To keep a review off the homepage, decline it instead.",
  declined:
    "It is gone for good. Declined reviews already stay off the homepage.",
};

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: review, error } = await supabase
    .from("reviews")
    .select(
      "id, author_name, rating, comment, source, reviewed_on, is_published, status",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!review) notFound();
  const status = isOneOf(reviewStatuses, review.status)
    ? review.status
    : "approved";
  const pending = status === "pending";

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/reviews", label: "Reviews" }}
        eyebrow="Edit review"
        title={`Review by ${review.author_name}`}
      />
      {status !== "approved" && (
        <section
          className={`${s.card} ${s.decisionPanel}`}
          aria-labelledby="decision-title"
        >
          <div>
            <h2 id="decision-title">
              {pending ? "Waiting for approval" : "Declined"}
            </h2>
            <p>
              {pending
                ? "A guest wrote this review on the homepage. Approve it to publish it, or decline it to keep it off the site."
                : "This review isn’t shown on the homepage. Approve it to publish it."}
            </p>
          </div>
          <ReviewDecision
            action={moderateReview}
            id={review.id}
            name={review.author_name}
            declined={!pending}
          />
        </section>
      )}
      <ReviewForm
        review={review}
        today={new Date().toISOString().slice(0, 10)}
      />
      <DangerZone title="Delete this review" description={deleteNotes[status]}>
        <DeleteButton
          action={deleteReview}
          id={review.id}
          name={`Review by ${review.author_name}`}
          what="review"
          variant="button"
        />
      </DangerZone>
    </div>
  );
}
