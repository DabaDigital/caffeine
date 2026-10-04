import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { ReviewForm } from "@/components/admin/forms/ReviewForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteReview } from "../actions";

export const metadata: Metadata = { title: "Edit review" };

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
      "id, author_name, rating, comment, source, reviewed_on, is_published",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!review) notFound();

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/reviews", label: "Reviews" }}
        eyebrow="Edit review"
        title={`Review by ${review.author_name}`}
      />
      <ReviewForm
        review={review}
        today={new Date().toISOString().slice(0, 10)}
      />
      <DangerZone
        title="Delete this review"
        description="It disappears from the homepage. To hide it temporarily, switch off “Published” instead."
      >
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
