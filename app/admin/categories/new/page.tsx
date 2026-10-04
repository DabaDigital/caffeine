import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/Page";
import { CategoryForm } from "@/components/admin/forms/CategoryForm";
import { requireAdmin } from "@/lib/auth";
import { nextSortOrder } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: "Add category" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const sortOrder = await nextSortOrder(await createClient(), "categories");
  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/categories", label: "Categories" }}
        eyebrow="Menu"
        title="Add a category"
      />
      <CategoryForm defaultSortOrder={sortOrder} />
    </div>
  );
}
