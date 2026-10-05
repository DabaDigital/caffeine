import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareQuote, Plus } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import { Pagination } from "@/components/admin/Pagination";
import { ReviewTable, type ReviewRow } from "@/components/admin/ReviewTable";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { paginate } from "@/lib/pagination";
import { isOneOf, reviewStatuses } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteReview, moderateReviews, toggleReview } from "./actions";

export const metadata: Metadata = { title: "Reviews" };

const dateFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const tabs = [
  { value: "pending", label: "Waiting for approval" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
  { value: "declined", label: "Declined" },
  { value: "all", label: "All" },
] as const;
type Tab = (typeof tabs)[number]["value"];
const tabValues = tabs.map((tab) => tab.value);

const emptyTabs: Record<Tab, { title: string; text: string }> = {
  pending: {
    title: "All caught up",
    text: "Reviews guests write on the homepage wait here until you approve or decline them.",
  },
  published: {
    title: "Nothing published",
    text: "Approved reviews appear here and on the homepage.",
  },
  hidden: {
    title: "Nothing hidden",
    text: "Approved reviews you switch off stay here, off the homepage.",
  },
  declined: {
    title: "Nothing declined",
    text: "Reviews you decline stay here, in case you change your mind.",
  },
  all: { title: "Nothing here", text: "There are no reviews yet." },
};

type Review = {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  source: string | null;
  reviewed_on: string | null;
  is_published: boolean;
  status: string;
};

function inTab(tab: Tab, review: Review) {
  if (tab === "pending") return review.status === "pending";
  if (tab === "published") return review.is_published;
  if (tab === "hidden")
    return review.status === "approved" && !review.is_published;
  if (tab === "declined") return review.status === "declined";
  return true;
}

const toRow = (review: Review): ReviewRow => ({
  id: review.id,
  author: review.author_name,
  rating: review.rating,
  comment: review.comment,
  // Where and when it was written, e.g. "Google · Oct 3, 2026".
  origin:
    [
      review.source,
      review.reviewed_on && dateFormat.format(new Date(review.reviewed_on)),
    ]
      .filter(Boolean)
      .join(" · ") || "No source",
  status: isOneOf(reviewStatuses, review.status) ? review.status : "approved",
  published: review.is_published,
});

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    notice?: string;
    n?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const { status = "", notice, n } = params;
  const supabase = await createClient();
  const result = await supabase
    .from("reviews")
    .select(
      "id, author_name, rating, comment, source, reviewed_on, is_published, status",
    )
    .order("reviewed_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const header = (
    <PageHeader
      eyebrow="Café"
      title="Reviews"
      description="Kind words from your guests. Reviews written on the homepage wait here for your approval; published ones appear on the homepage, newest first."
      actions={
        <AddLink href="/admin/reviews/new">
          <Plus size={17} aria-hidden="true" /> Add review
        </AddLink>
      }
    />
  );

  // Review approval arrives with its own migration (42703: unknown column).
  if (result.error?.code === "42703")
    return (
      <div className={s.page}>
        {header}
        <EmptyState
          icon={MessageSquareQuote}
          title="One database update needed"
        >
          Run supabase/migrations/20261005120000_guest_reviews.sql in the
          Supabase SQL editor, then refresh this page.
        </EmptyState>
      </div>
    );

  const all = rows(result);
  const counts = Object.fromEntries(
    tabs.map(({ value }) => [
      value,
      all.filter((review) => inTab(value, review)).length,
    ]),
  ) as Record<Tab, number>;
  // Reviews waiting for a decision come first; otherwise everything.
  const tab: Tab = isOneOf(tabValues, status)
    ? status
    : counts.pending
      ? "pending"
      : "all";
  const listed = all.filter((review) => inTab(tab, review));
  const pagination = paginate(listed, params.page);

  return (
    <div className={s.page}>
      {header}
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
          Reviews guests write on the homepage wait here for your approval. You
          can also add real reviews from Google, Instagram or your guest book.
        </EmptyState>
      ) : (
        <>
          <nav className={s.tabs} aria-label="Reviews by status">
            {tabs.map(({ value, label }) => (
              <Link
                key={value}
                href={`/admin/reviews?status=${value}`}
                aria-current={tab === value ? "page" : undefined}
              >
                {label}
                <span
                  className={`${s.tabCount} ${value === "pending" && counts.pending ? s.tabCountAlert : ""}`}
                >
                  {counts[value]}
                </span>
              </Link>
            ))}
          </nav>
          <ReviewTable
            reviews={pagination.items.map(toRow)}
            waiting={
              tab === "pending" ? listed.map((review) => review.id) : undefined
            }
            empty={
              <EmptyState
                icon={MessageSquareQuote}
                title={emptyTabs[tab].title}
              >
                {emptyTabs[tab].text}
              </EmptyState>
            }
            moderate={moderateReviews}
            toggle={toggleReview}
            remove={deleteReview}
          />
          <Pagination
            pagination={pagination}
            pathname="/admin/reviews"
            searchParams={{ ...params, status: tab }}
          />
        </>
      )}
    </div>
  );
}
