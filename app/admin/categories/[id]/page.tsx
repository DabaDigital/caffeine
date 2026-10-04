import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { CategoryForm } from "@/components/admin/forms/CategoryForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteCategory } from "../actions";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, description, icon, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!category) notFound();

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/categories", label: "Categories" }}
        eyebrow="Edit category"
        title={category.name}
      />
      <CategoryForm category={category} />
      <DangerZone
        title="Delete this category"
        description="Only empty categories can be deleted. Move or delete its products first."
      >
        <DeleteButton
          action={deleteCategory}
          id={category.id}
          name={category.name}
          what="category"
          variant="button"
          consequence="It will disappear from the menu filters."
        />
      </DangerZone>
    </div>
  );
}
