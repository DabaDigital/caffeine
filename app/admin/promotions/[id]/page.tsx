import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { PromotionForm } from "@/components/admin/forms/PromotionForm";
import { requireAdmin } from "@/lib/auth";
import { cafeToday } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deletePromotion } from "../actions";
import { promotionChoices } from "../choices";

export const metadata: Metadata = { title: "Edit promotion" };

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const [result, products] = await Promise.all([
    supabase
      .from("promotions")
      .select(
        "id, title, description, discount_type, discount_value, starts_on, ends_on, is_active, promotion_products(product_id)",
      )
      .eq("id", id)
      .maybeSingle(),
    promotionChoices(supabase, id),
  ]);
  if (result.error) throw new Error(result.error.message);
  const promotion = result.data;
  if (!promotion) notFound();

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/promotions", label: "Promotions" }}
        eyebrow="Edit promotion"
        title={promotion.title}
      />
      <PromotionForm
        promotion={{
          ...promotion,
          product_ids: promotion.promotion_products.map(
            (link) => link.product_id,
          ),
        }}
        products={products}
        today={cafeToday()}
      />
      <DangerZone
        title="Delete this promotion"
        description="It disappears from the homepage. To stop it for now, switch off “Active” instead."
      >
        <DeleteButton
          action={deletePromotion}
          id={promotion.id}
          name={promotion.title}
          what="promotion"
          variant="button"
          consequence="It disappears from the homepage. The products stay on the menu."
        />
      </DangerZone>
    </div>
  );
}
