import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/Page";
import { ReviewForm } from "@/components/admin/forms/ReviewForm";
import { requireAdmin } from "@/lib/auth";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: "Add review" };

export default async function NewReviewPage() {
  await requireAdmin();
  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/reviews", label: "Reviews" }}
        eyebrow="Café"
        title="Add a review"
      />
      <ReviewForm today={new Date().toISOString().slice(0, 10)} />
    </div>
  );
}
