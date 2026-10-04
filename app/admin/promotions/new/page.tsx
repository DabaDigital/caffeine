import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/Page";
import { PromotionForm } from "@/components/admin/forms/PromotionForm";
import { requireAdmin } from "@/lib/auth";
import { cafeToday } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { promotionChoices } from "../choices";

export const metadata: Metadata = { title: "Create promotion" };

export default async function NewPromotionPage() {
  await requireAdmin();
  const products = await promotionChoices(await createClient());
  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/promotions", label: "Promotions" }}
        eyebrow="Menu"
        title="Create a promotion"
        description="Pick one product for a single-item deal, or several for a bundle."
      />
      <PromotionForm products={products} today={cafeToday()} />
    </div>
  );
}
