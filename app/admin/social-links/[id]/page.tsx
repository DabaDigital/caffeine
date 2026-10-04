import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { SocialLinkForm } from "@/components/admin/forms/SocialLinkForm";
import { requireAdmin } from "@/lib/auth";
import { isOneOf, socialPlatformLabels, socialPlatforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteSocialLink } from "../actions";

export const metadata: Metadata = { title: "Edit social link" };

export default async function EditSocialLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: link, error } = await supabase
    .from("social_links")
    .select("id, platform, label, url, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!link) notFound();
  const name =
    link.label ||
    (isOneOf(socialPlatforms, link.platform)
      ? socialPlatformLabels[link.platform]
      : "Social link");

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/social-links", label: "Social links" }}
        eyebrow="Edit social link"
        title={name}
      />
      <SocialLinkForm link={link} />
      <DangerZone
        title="Delete this link"
        description="It disappears from the homepage footer."
      >
        <DeleteButton
          action={deleteSocialLink}
          id={link.id}
          name={name}
          what="link"
          variant="button"
        />
      </DangerZone>
    </div>
  );
}
