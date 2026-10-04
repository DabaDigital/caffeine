"use client";

import {
  AdminForm,
  Fields,
  FormSection,
  IconChoiceField,
  TextField,
  ToggleField,
} from "@/components/admin/form";
import { categoryIconComponents } from "@/components/icons";
import { saveCategory } from "@/app/admin/categories/actions";
import { categoryIconLabels, categoryIcons } from "@/lib/site";
import type { Tables } from "@/lib/supabase/database.types";

type Category = Pick<
  Tables<"categories">,
  "id" | "name" | "description" | "icon" | "sort_order" | "is_active"
>;

export function CategoryForm({
  category,
  defaultSortOrder = 0,
}: {
  category?: Category;
  defaultSortOrder?: number;
}) {
  return (
    <AdminForm
      action={saveCategory}
      submitLabel={category ? "Save changes" : "Add category"}
      cancelHref="/admin/categories"
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormSection
        title="Category"
        description="Guests filter the menu by category on the homepage."
      >
        <Fields>
          <TextField
            name="name"
            label="Name"
            maxLength={60}
            defaultValue={category?.name}
            placeholder="Coffee"
          />
          <TextField
            name="sort_order"
            label="Display order"
            optional
            type="number"
            min={0}
            max={9999}
            defaultValue={category?.sort_order ?? defaultSortOrder}
            hint="Lower numbers appear first."
          />
          <TextField
            name="description"
            label="Description"
            optional
            wide
            maxLength={300}
            defaultValue={category?.description ?? ""}
            placeholder="Espresso classics, hot or iced."
          />
        </Fields>
        <IconChoiceField
          name="icon"
          legend="Icon"
          defaultValue={category?.icon ?? "coffee"}
          options={categoryIcons.map((icon) => ({
            value: icon,
            label: categoryIconLabels[icon],
            icon: categoryIconComponents[icon],
          }))}
        />
        <ToggleField
          name="is_active"
          label="Visible on the website"
          description="Hiding a category also hides its products."
          defaultChecked={category?.is_active ?? true}
        />
      </FormSection>
    </AdminForm>
  );
}
