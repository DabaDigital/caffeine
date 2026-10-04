import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Coffee, Pencil, Plus, Sparkles, Tags } from "lucide-react";
import { AddLink, EmptyState, Hint, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import {
  DeleteButton,
  ListFilters,
  ToggleSwitch,
} from "@/components/admin/controls";
import { categoryIconComponents } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { displayableImage } from "@/lib/images";
import { rows } from "@/lib/admin";
import { categoryIcons, currency, formatPrice, isOneOf } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteProduct, toggleProduct } from "./actions";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    notice?: string;
    n?: string;
  }>;
}) {
  await requireAdmin();
  const { q = "", category = "", notice, n } = await searchParams;
  const supabase = await createClient();
  const [categories, all] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon")
      .order("sort_order")
      .order("name")
      .then(rows),
    supabase
      .from("products")
      .select(
        "id, name, description, price, image_url, is_available, is_featured, category_id",
      )
      .order("sort_order")
      .order("name")
      .then(rows),
  ]);

  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const needle = q.trim().toLocaleLowerCase();
  const products = all.filter(
    (product) =>
      (!category || product.category_id === category) &&
      (!needle ||
        `${product.name} ${product.description ?? ""}`
          .toLocaleLowerCase()
          .includes(needle)),
  );
  const featuredCount = all.filter(
    (product) => product.is_featured && product.is_available,
  ).length;

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Menu"
        title="Products"
        description="Everything on your menu. Featured products fill the homepage carousel; the first one with a photo stars in the hero."
        actions={
          categories.length > 0 && (
            <AddLink href="/admin/products/new">
              <Plus size={17} aria-hidden="true" /> Add product
            </AddLink>
          )
        }
      />
      <Notice key={n} notice={notice} item="Product" />

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Start with a category"
          action={
            <AddLink href="/admin/categories/new">
              <Plus size={17} aria-hidden="true" /> Add a category
            </AddLink>
          }
        >
          Products belong to a category such as Coffee or Crêpes. Create one
          first, then add your products.
        </EmptyState>
      ) : all.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="No products yet"
          action={
            <AddLink href="/admin/products/new">
              <Plus size={17} aria-hidden="true" /> Add your first product
            </AddLink>
          }
        >
          Add the drinks and treats you serve. They appear on the homepage as
          soon as you save.
        </EmptyState>
      ) : (
        <>
          {featuredCount === 0 && (
            <Hint icon={Sparkles}>
              No product is featured, so the homepage carousel shows your first
              products. Switch on “Featured” for your favorites.
            </Hint>
          )}
          <ListFilters
            search={{ value: q, label: "Search products" }}
            filter={{
              name: "category",
              value: category,
              label: "Filter by category",
              options: [
                { value: "", label: "All categories" },
                ...categories.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ],
            }}
            shown={products.length}
            total={all.length}
          />
          {products.length === 0 ? (
            <EmptyState icon={Coffee} title="No matching products">
              Try another word or category.
            </EmptyState>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">On menu</th>
                  <th scope="col">Featured</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const productCategory = categoryById.get(product.category_id);
                  const Icon =
                    categoryIconComponents[
                      productCategory &&
                      isOneOf(categoryIcons, productCategory.icon)
                        ? productCategory.icon
                        : "coffee"
                    ];
                  const image = displayableImage(product.image_url);
                  return (
                    <tr key={product.id}>
                      <td className={s.cellMain}>
                        <div className={s.itemTitle}>
                          <span className={s.thumb}>
                            {image ? (
                              <Image src={image} alt="" fill sizes="56px" />
                            ) : (
                              <Icon size={22} aria-hidden="true" />
                            )}
                          </span>
                          <div>
                            <Link href={`/admin/products/${product.id}`}>
                              <strong>{product.name}</strong>
                            </Link>
                            <span>
                              {product.description || "No description yet"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Category">
                        <span className={s.pill}>
                          <Icon size={13} aria-hidden="true" />
                          {productCategory?.name ?? "—"}
                        </span>
                      </td>
                      <td data-label="Price">
                        {product.price !== null ? (
                          <span className={s.price}>
                            {formatPrice(product.price)} {currency}
                          </span>
                        ) : (
                          <span className={s.muted}>No price</span>
                        )}
                      </td>
                      <td data-label="On menu">
                        <ToggleSwitch
                          action={toggleProduct}
                          id={product.id}
                          field="is_available"
                          checked={product.is_available}
                          label={`Show ${product.name} on the menu`}
                        />
                      </td>
                      <td data-label="Featured">
                        <ToggleSwitch
                          action={toggleProduct}
                          id={product.id}
                          field="is_featured"
                          checked={product.is_featured}
                          label={`Feature ${product.name} on the homepage`}
                        />
                      </td>
                      <td className={s.cellActions}>
                        <div className={s.actions}>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className={s.iconButton}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil size={17} />
                          </Link>
                          <DeleteButton
                            action={deleteProduct}
                            id={product.id}
                            name={product.name}
                            what="product"
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
