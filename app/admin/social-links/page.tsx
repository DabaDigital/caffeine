import { Pagination } from "@/components/admin/Pagination";
import { paginate } from "@/lib/pagination";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Share2 } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import { DeleteButton, ToggleSwitch } from "@/components/admin/controls";
import { socialIconComponents } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { isOneOf, socialPlatformLabels, socialPlatforms } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteSocialLink, toggleSocialLink } from "./actions";

export const metadata: Metadata = { title: "Social links" };

export default async function SocialLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; notice?: string; n?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const { notice, n } = params;
  const supabase = await createClient();
  const links = await supabase
    .from("social_links")
    .select("id, platform, label, url, is_active")
    .order("sort_order")
    .order("created_at")
    .order("id")
    .then(rows);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Café"
        title="Social links"
        description="Your profiles on Instagram, TikTok and more, shown in the homepage footer."
        actions={
          <AddLink href="/admin/social-links/new">
            <Plus size={17} aria-hidden="true" /> Add link
          </AddLink>
        }
      />
      <Notice key={n} notice={notice} item="Social link" />
      {links.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No social links yet"
          action={
            <AddLink href="/admin/social-links/new">
              <Plus size={17} aria-hidden="true" /> Add your Instagram
            </AddLink>
          }
        >
          Help guests follow your daily brew.
        </EmptyState>
      ) : (
        <>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Platform</th>
                <th scope="col">Link</th>
                <th scope="col">Visible</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginate(links, params.page).items.map((link) => {
                const platform = isOneOf(socialPlatforms, link.platform)
                  ? link.platform
                  : "website";
                const Icon = socialIconComponents[platform];
                const name = link.label || socialPlatformLabels[platform];
                return (
                  <tr key={link.id}>
                    <td className={s.cellMain}>
                      <div className={s.itemTitle}>
                        <span className={`${s.thumb} ${s.thumbRound}`}>
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <div>
                          <Link href={`/admin/social-links/${link.id}`}>
                            <strong>{socialPlatformLabels[platform]}</strong>
                          </Link>
                          <span>{name}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Link">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.linkUrl}
                      >
                        <span>{link.url}</span>
                        <ExternalLink
                          size={14}
                          aria-label="(opens in a new tab)"
                        />
                      </a>
                    </td>
                    <td data-label="Visible">
                      <ToggleSwitch
                        action={toggleSocialLink}
                        id={link.id}
                        field="is_active"
                        checked={link.is_active}
                        label={`Show ${name} on the website`}
                      />
                    </td>
                    <td className={s.cellActions}>
                      <div className={s.actions}>
                        <Link
                          href={`/admin/social-links/${link.id}`}
                          className={s.iconButton}
                          aria-label={`Edit ${name}`}
                        >
                          <Pencil size={17} />
                        </Link>
                        <DeleteButton
                          action={deleteSocialLink}
                          id={link.id}
                          name={name}
                          what="link"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            pagination={paginate(links, params.page)}
            pathname="/admin/social-links"
            searchParams={params}
          />
        </>
      )}
    </div>
  );
}
