import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { ProductForm } from "@/components/admin/forms/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteProduct } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const [product, categories] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, description, details, price, image_url, badge, highlight_word, tagline, ingredients, is_featured, is_available, sort_order",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, icon")
      .order("sort_order")
      .order("name")
      .then(rows),
  ]);
  if (product.error) throw new Error(product.error.message);
  if (!product.data) notFound();

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        eyebrow="Edit product"
        title={product.data.name}
      />
      <ProductForm product={product.data} categories={categories} />
      <DangerZone
        title="Delete this product"
        description="It disappears from the menu and the homepage. Its uploaded photo is deleted too."
      >
        <DeleteButton
          action={deleteProduct}
          id={product.data.id}
          name={product.data.name}
          what="product"
          variant="button"
        />
      </DangerZone>
    </div>
  );
}
