"use client";

import {
  AdminForm,
  Fields,
  FormSection,
  ImageField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
  Toggles,
} from "@/components/admin/form";
import { saveProduct } from "@/app/admin/products/actions";
import { categoryIconComponents } from "@/components/icons";
import { categoryIcons, isOneOf } from "@/lib/site";
import type { Tables } from "@/lib/supabase/database.types";

type Product = Pick<
  Tables<"products">,
  | "id"
  | "category_id"
  | "name"
  | "description"
  | "details"
  | "price"
  | "image_url"
  | "badge"
  | "highlight_word"
  | "tagline"
  | "ingredients"
  | "is_featured"
  | "is_available"
  | "sort_order"
>;

export function ProductForm({
  product,
  categories,
  defaultSortOrder = 0,
}: {
  product?: Product;
  categories: { id: string; name: string; icon: string }[];
  defaultSortOrder?: number;
}) {
  return (
    <AdminForm
      action={saveProduct}
      submitLabel={product ? "Save changes" : "Add product"}
      cancelHref="/admin/products"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormSection
        title="Basics"
        description="What guests see in the menu and product details."
      >
        <ImageField label="Photo" current={product?.image_url ?? null} />
        <Fields>
          <TextField
            name="name"
            label="Name"
            maxLength={80}
            defaultValue={product?.name}
            placeholder="Iced Caramel Latte"
          />
          <SelectField
            name="category_id"
            label="Category"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
              icon: categoryIconComponents[
                isOneOf(categoryIcons, category.icon) ? category.icon : "coffee"
              ],
            }))}
            placeholder="Choose a category"
            defaultValue={product?.category_id ?? ""}
          />
          <TextField
            name="price"
            label="Price (MAD)"
            optional
            inputMode="decimal"
            defaultValue={product?.price ?? ""}
            placeholder="45"
            hint="Leave empty to show no price."
          />
          <TextField
            name="sort_order"
            label="Display order"
            optional
            type="number"
            min={0}
            max={9999}
            defaultValue={product?.sort_order ?? defaultSortOrder}
            hint="Lower numbers appear first."
          />
          <TextField
            name="description"
            label="Short description"
            optional
            wide
            maxLength={200}
            defaultValue={product?.description ?? ""}
            placeholder="Rich espresso, fresh milk and a touch of caramel."
            hint="One line, shown on menu cards."
          />
          <TextAreaField
            name="details"
            label="Full description"
            optional
            wide
            maxLength={1000}
            rows={4}
            defaultValue={product?.details ?? ""}
            hint="Shown when a guest opens the product."
          />
        </Fields>
      </FormSection>

      <FormSection
        title="Homepage spotlight"
        description="Optional touches used when this product appears in the homepage carousel."
      >
        <Fields>
          <TextField
            name="ingredients"
            label="Flavor notes"
            optional
            wide
            defaultValue={product?.ingredients.join(", ") ?? ""}
            placeholder="Espresso, Silky milk, Caramel"
            hint="Separate with commas, up to 8."
          />
          <TextField
            name="badge"
            label="Badge"
            optional
            maxLength={40}
            defaultValue={product?.badge ?? ""}
            placeholder="ICED & EASY"
            hint="Small label above the photo."
          />
          <TextField
            name="highlight_word"
            label="Mood word"
            optional
            maxLength={16}
            defaultValue={product?.highlight_word ?? ""}
            placeholder="chill."
            hint="Large word behind the photo. Defaults to the category."
          />
          <TextField
            name="tagline"
            label="Handwritten tagline"
            optional
            wide
            maxLength={80}
            defaultValue={product?.tagline ?? ""}
            placeholder="your daily pick-me-up."
          />
        </Fields>
      </FormSection>

      <FormSection title="Visibility">
        <Toggles>
          <ToggleField
            name="is_available"
            label="On the menu"
            description="Visible on the homepage and in the menu."
            defaultChecked={product?.is_available ?? true}
          />
          <ToggleField
            name="is_featured"
            label="Featured"
            description="Shown in the homepage carousel and hero."
            defaultChecked={product?.is_featured ?? false}
          />
        </Toggles>
      </FormSection>
    </AdminForm>
  );
}
