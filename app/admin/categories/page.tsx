import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Tags } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import { DeleteButton, ToggleSwitch } from "@/components/admin/controls";
import { categoryIconComponents } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { categoryIcons, isOneOf } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteCategory, toggleCategory } from "./actions";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; n?: string }>;
}) {
  await requireAdmin();
  const { notice, n } = await searchParams;
  const supabase = await createClient();
  const categories = await supabase
    .from("categories")
    .select(
      "id, name, description, icon, sort_order, is_active, products(count)",
    )
    .order("sort_order")
    .order("name")
    .then(rows);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Menu"
        title="Categories"
        description="Group your menu, like Coffee or Crêpes. Guests use them to filter the menu."
        actions={
          <AddLink href="/admin/categories/new">
            <Plus size={17} aria-hidden="true" /> Add category
          </AddLink>
        }
      />
      <Notice key={n} notice={notice} item="Category" />
      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          action={
            <AddLink href="/admin/categories/new">
              <Plus size={17} aria-hidden="true" /> Add your first category
            </AddLink>
          }
        >
          Categories organise your menu. Add one, then add products to it.
        </EmptyState>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Products</th>
              <th scope="col">Order</th>
              <th scope="col">Visible</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const Icon =
                categoryIconComponents[
                  isOneOf(categoryIcons, category.icon)
                    ? category.icon
                    : "coffee"
                ];
              const productCount = category.products[0]?.count ?? 0;
              return (
                <tr key={category.id}>
                  <td className={s.cellMain}>
                    <div className={s.itemTitle}>
                      <span className={`${s.thumb} ${s.thumbRound}`}>
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <Link href={`/admin/categories/${category.id}`}>
                          <strong>{category.name}</strong>
                        </Link>
                        <span>{category.description || "No description"}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Products">
                    <Link href={`/admin/products?category=${category.id}`}>
                      {productCount}{" "}
                      {productCount === 1 ? "product" : "products"}
                    </Link>
                  </td>
                  <td data-label="Order">{category.sort_order}</td>
                  <td data-label="Visible">
                    <ToggleSwitch
                      action={toggleCategory}
                      id={category.id}
                      field="is_active"
                      checked={category.is_active}
                      label={`Show ${category.name} on the website`}
                    />
                  </td>
                  <td className={s.cellActions}>
                    <div className={s.actions}>
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className={s.iconButton}
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil size={17} />
                      </Link>
                      <DeleteButton
                        action={deleteCategory}
                        id={category.id}
                        name={category.name}
                        what="category"
                        consequence={
                          productCount
                            ? `It still has ${productCount} ${productCount === 1 ? "product" : "products"}, so you'll need to move or delete them first.`
                            : "It will disappear from the menu filters."
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
