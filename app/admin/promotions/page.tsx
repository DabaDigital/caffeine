import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Coffee, Pencil, Plus } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import {
  DeleteButton,
  ListFilters,
  ToggleSwitch,
} from "@/components/admin/controls";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { displayableImage } from "@/lib/images";
import {
  cafeToday,
  currency,
  discountTypes,
  formatPrice,
  isOneOf,
  offerLabel,
  promotionStatus,
  promotionTotals,
  shortDate,
  type PromotionStatus,
} from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deletePromotion, togglePromotion } from "./actions";

export const metadata: Metadata = { title: "Promotions" };

const statusLabels: Record<
  PromotionStatus,
  { text: string; className: string }
> = {
  running: { text: "Running", className: s.pillOn },
  scheduled: { text: "Scheduled", className: s.pillScheduled },
  ended: { text: "Ended", className: s.pillEnded },
  paused: { text: "Paused", className: "" },
};
const money = (value: number) => `${formatPrice(value)} ${currency}`;

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; n?: string }>;
}) {
  await requireAdmin();
  const { status = "", notice, n } = await searchParams;
  const supabase = await createClient();
  const result = await supabase
    .from("promotions")
    .select(
      "id, title, description, discount_type, discount_value, starts_on, ends_on, is_active, promotion_products(products(id, name, price, image_url))",
    )
    .order("starts_on", { ascending: false });

  const header = (
    <PageHeader
      eyebrow="Menu"
      title="Promotions"
      description="Exclusive offers on one product or several: a percentage, an amount off, a special price or a bundle."
      actions={
        result.error?.code !== "PGRST205" && (
          <AddLink href="/admin/promotions/new">
            <Plus size={17} aria-hidden="true" /> Create promotion
          </AddLink>
        )
      }
    />
  );

  // The promotions table arrives with its own migration.
  if (result.error?.code === "PGRST205")
    return (
      <div className={s.page}>
        {header}
        <EmptyState icon={BadgePercent} title="One database update needed">
          Run supabase/migrations/20261004090000_promotions.sql in the Supabase
          SQL editor, then refresh this page.
        </EmptyState>
      </div>
    );

  const today = cafeToday();
  const all = rows(result).map((promotion) => {
    const products = promotion.promotion_products.flatMap((link) =>
      link.products ? [link.products] : [],
    );
    const type = isOneOf(discountTypes, promotion.discount_type)
      ? promotion.discount_type
      : "percent";
    const prices = products.flatMap((product) =>
      product.price === null ? [] : [product.price],
    );
    const totals = promotionTotals(type, promotion.discount_value, prices);
    return {
      ...promotion,
      products,
      totals,
      label: offerLabel(
        type,
        promotion.discount_value,
        totals.regular,
        products.length,
      ),
      bundle: type === "price" && products.length > 1,
      status: promotionStatus(promotion, today),
    };
  });
  const promotions = status
    ? all.filter((promotion) => promotion.status === status)
    : all;

  return (
    <div className={s.page}>
      {header}
      <Notice key={n} notice={notice} item="Promotion" />
      {all.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          title="No promotions yet"
          action={
            <AddLink href="/admin/promotions/new">
              <Plus size={17} aria-hidden="true" /> Create your first offer
            </AddLink>
          }
        >
          Create an exclusive offer for one product or a bundle of several. It
          appears on the homepage while it runs.
        </EmptyState>
      ) : (
        <>
          <ListFilters
            filter={{
              name: "status",
              value: status,
              label: "Filter promotions",
              options: [
                { value: "", label: "All promotions" },
                { value: "running", label: "Running" },
                { value: "scheduled", label: "Scheduled" },
                { value: "ended", label: "Ended" },
                { value: "paused", label: "Paused" },
              ],
            }}
            shown={promotions.length}
            total={all.length}
          />
          {promotions.length === 0 ? (
            <EmptyState icon={BadgePercent} title="Nothing here">
              No promotions match this filter.
            </EmptyState>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Promotion</th>
                  <th scope="col">Offer</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Status</th>
                  <th scope="col">Active</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => {
                  const badge = statusLabels[promotion.status];
                  return (
                    <tr key={promotion.id}>
                      <td className={s.cellMain}>
                        <div className={s.itemTitle}>
                          <span className={s.thumbStack} aria-hidden="true">
                            {promotion.products.slice(0, 3).map((product) => {
                              const image = displayableImage(product.image_url);
                              return (
                                <span key={product.id} className={s.thumb}>
                                  {image ? (
                                    <Image
                                      src={image}
                                      alt=""
                                      fill
                                      sizes="44px"
                                    />
                                  ) : (
                                    <Coffee size={18} />
                                  )}
                                </span>
                              );
                            })}
                          </span>
                          <div>
                            <Link href={`/admin/promotions/${promotion.id}`}>
                              <strong>{promotion.title}</strong>
                            </Link>
                            <span>
                              {promotion.products
                                .map((product) => product.name)
                                .join(promotion.bundle ? " + " : ", ")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Offer">
                        <span className={s.itemTitle} style={{ gap: 8 }}>
                          <span className={`${s.pill} ${s.pillOn}`}>
                            {promotion.label}
                          </span>
                          {promotion.products.length === 1 ||
                          promotion.bundle ? (
                            <span className={s.price}>
                              {money(promotion.totals.offer)}{" "}
                              <s className={s.muted}>
                                {money(promotion.totals.regular)}
                              </s>
                            </span>
                          ) : (
                            <span className={s.muted}>
                              on {promotion.products.length} products
                            </span>
                          )}
                        </span>
                      </td>
                      <td data-label="Dates">
                        {promotion.ends_on
                          ? `${shortDate(promotion.starts_on)} – ${shortDate(promotion.ends_on)}`
                          : `From ${shortDate(promotion.starts_on)}`}
                      </td>
                      <td data-label="Status">
                        <span className={`${s.pill} ${badge.className}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td data-label="Active">
                        <ToggleSwitch
                          action={togglePromotion}
                          id={promotion.id}
                          field="is_active"
                          checked={promotion.is_active}
                          label={`Activate ${promotion.title}`}
                        />
                      </td>
                      <td className={s.cellActions}>
                        <div className={s.actions}>
                          <Link
                            href={`/admin/promotions/${promotion.id}`}
                            className={s.iconButton}
                            aria-label={`Edit ${promotion.title}`}
                          >
                            <Pencil size={17} />
                          </Link>
                          <DeleteButton
                            action={deletePromotion}
                            id={promotion.id}
                            name={promotion.title}
                            what="promotion"
                            consequence="It disappears from the homepage. The products stay on the menu."
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
