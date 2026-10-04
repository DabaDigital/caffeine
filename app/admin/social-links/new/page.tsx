import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/Page";
import { SocialLinkForm } from "@/components/admin/forms/SocialLinkForm";
import { requireAdmin } from "@/lib/auth";
import { nextSortOrder } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: "Add social link" };

export default async function NewSocialLinkPage() {
  await requireAdmin();
  const sortOrder = await nextSortOrder(await createClient(), "social_links");
  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/social-links", label: "Social links" }}
        eyebrow="Café"
        title="Add a social link"
      />
      <SocialLinkForm defaultSortOrder={sortOrder} />
    </div>
  );
}
