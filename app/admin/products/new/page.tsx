import type { Metadata } from "next";
import { Plus, Tags } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { ProductForm } from "@/components/admin/forms/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { nextSortOrder, rows } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [categories, sortOrder] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon")
      .order("sort_order")
      .order("name")
      .then(rows),
    nextSortOrder(supabase, "products"),
  ]);

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        eyebrow="Menu"
        title="Add a product"
        description="It appears on the homepage as soon as you save, unless you switch off “On the menu”."
      />
      {categories.length ? (
        <ProductForm categories={categories} defaultSortOrder={sortOrder} />
      ) : (
        <EmptyState
          icon={Tags}
          title="Start with a category"
          action={
            <AddLink href="/admin/categories/new">
              <Plus size={17} aria-hidden="true" /> Add a category
            </AddLink>
          }
        >
          Every product belongs to a category. Create one first.
        </EmptyState>
      )}
    </div>
  );
}
