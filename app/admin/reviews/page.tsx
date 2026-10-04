import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareQuote, Pencil, Plus, Star } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import {
  DeleteButton,
  ListFilters,
  ToggleSwitch,
} from "@/components/admin/controls";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteReview, toggleReview } from "./actions";

export const metadata: Metadata = { title: "Reviews" };

const dateFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; n?: string }>;
}) {
  await requireAdmin();
  const { status = "", notice, n } = await searchParams;
  const supabase = await createClient();
  const all = await supabase
    .from("reviews")
    .select(
      "id, author_name, rating, comment, source, reviewed_on, is_published",
    )
    .order("reviewed_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .then(rows);
  const reviews = all.filter(
    (review) =>
      !status ||
      (status === "published" ? review.is_published : !review.is_published),
  );

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Café"
        title="Reviews"
        description="Kind words from your guests. Published reviews appear on the homepage, newest first."
        actions={
          <AddLink href="/admin/reviews/new">
            <Plus size={17} aria-hidden="true" /> Add review
          </AddLink>
        }
      />
      <Notice key={n} notice={notice} item="Review" />
      {all.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No reviews yet"
          action={
            <AddLink href="/admin/reviews/new">
              <Plus size={17} aria-hidden="true" /> Add a review
            </AddLink>
          }
        >
          Add real reviews from Google, Instagram or your guest book. Until one
          is published, the homepage invites guests to share feedback.
        </EmptyState>
      ) : (
        <>
          <ListFilters
            filter={{
              name: "status",
              value: status,
              label: "Filter reviews",
              options: [
                { value: "", label: "All reviews" },
                { value: "published", label: "Published" },
                { value: "hidden", label: "Hidden" },
              ],
            }}
            shown={reviews.length}
            total={all.length}
          />
          {reviews.length === 0 ? (
            <EmptyState icon={MessageSquareQuote} title="Nothing here">
              No reviews match this filter.
            </EmptyState>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Review</th>
                  <th scope="col">Published</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td className={s.cellMain}>
                      <div className={s.itemTitle}>
                        <span
                          className={`${s.thumb} ${s.thumbRound}`}
                          aria-hidden="true"
                        >
                          {review.author_name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <Link href={`/admin/reviews/${review.id}`}>
                            <strong>{review.author_name}</strong>
                          </Link>
                          <span>
                            {[
                              review.source,
                              review.reviewed_on &&
                                dateFormat.format(new Date(review.reviewed_on)),
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No source"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Rating">
                      <span
                        className={s.stars}
                        role="img"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={15}
                            aria-hidden="true"
                            data-filled={star <= review.rating}
                          />
                        ))}
                      </span>
                    </td>
                    <td data-label="Review">
                      <span className={s.quote}>{review.comment}</span>
                    </td>
                    <td data-label="Published">
                      <ToggleSwitch
                        action={toggleReview}
                        id={review.id}
                        field="is_published"
                        checked={review.is_published}
                        label={`Publish the review by ${review.author_name}`}
                      />
                    </td>
                    <td className={s.cellActions}>
                      <div className={s.actions}>
                        <Link
                          href={`/admin/reviews/${review.id}`}
                          className={s.iconButton}
                          aria-label={`Edit the review by ${review.author_name}`}
                        >
                          <Pencil size={17} />
                        </Link>
                        <DeleteButton
                          action={deleteReview}
                          id={review.id}
                          name={`Review by ${review.author_name}`}
                          what="review"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
