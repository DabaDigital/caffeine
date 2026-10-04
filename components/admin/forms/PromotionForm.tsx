"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  AdminForm,
  DateField,
  Fields,
  FormSection,
  MultiSelectField,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/form";
import { categoryIconComponents } from "@/components/icons";
import { savePromotion } from "@/app/admin/promotions/actions";
import {
  categoryIcons,
  currency,
  discountTypeLabels,
  discountTypes,
  discountedPrice,
  formatPrice,
  isOneOf,
  offerLabel,
  promotionTotals,
  type DiscountType,
} from "@/lib/site";
import s from "@/components/admin/admin.module.css";

export type PromotionProduct = {
  id: string;
  name: string;
  price: number | null;
  category: string;
  icon: string;
  /** Another active promotion that already includes this product. */
  elsewhere: string | null;
};

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  product_ids: string[];
};

const money = (value: number) => `${formatPrice(value)} ${currency}`;

export function PromotionForm({
  promotion,
  products,
  today,
}: {
  promotion?: Promotion;
  products: PromotionProduct[];
  today: string;
}) {
  const [productIds, setProductIds] = useState(promotion?.product_ids ?? []);
  const [type, setType] = useState<DiscountType>(
    promotion && isOneOf(discountTypes, promotion.discount_type)
      ? promotion.discount_type
      : "percent",
  );
  const [value, setValue] = useState(
    promotion ? formatPrice(promotion.discount_value) : "",
  );
  const [startsOn, setStartsOn] = useState(promotion?.starts_on ?? today);

  const chosen = products.filter((product) => productIds.includes(product.id));
  const bundle = type === "price" && chosen.length > 1;
  const valueField = {
    percent: {
      label: "Discount (%)",
      placeholder: "20",
      hint: "Taken off each selected product.",
    },
    amount: {
      label: "Amount off (MAD)",
      placeholder: "10",
      hint: "Taken off each selected product.",
    },
    price: bundle
      ? {
          label: "Bundle price (MAD)",
          placeholder: "85",
          hint: "One price for all selected products bought together.",
        }
      : {
          label: "Special price (MAD)",
          placeholder: "19",
          hint: "The new price of this product.",
        },
  }[type];

  return (
    <AdminForm
      action={savePromotion}
      submitLabel={promotion ? "Save changes" : "Create promotion"}
      cancelHref="/admin/promotions"
    >
      {promotion && <input type="hidden" name="id" value={promotion.id} />}
      <FormSection
        title="The offer"
        description="Exclusive offers appear on the homepage while they run."
      >
        <Fields>
          <TextField
            name="title"
            label="Title"
            wide
            maxLength={80}
            defaultValue={promotion?.title}
            placeholder="Weekend coffee date"
          />
          <TextAreaField
            name="description"
            label="Description"
            optional
            wide
            rows={2}
            maxLength={300}
            defaultValue={promotion?.description ?? ""}
            placeholder="An iced latte and a Lotus crêpe, every Saturday and Sunday."
          />
          <MultiSelectField
            name="product_ids"
            label="Products"
            wide
            searchable
            placeholder="Choose one or more products"
            hint="One product for a single-item deal, several for a bundle or a range."
            values={productIds}
            onChange={setProductIds}
            options={products.map((product) => ({
              value: product.id,
              label: product.name,
              description: [
                product.price === null ? "No price yet" : money(product.price),
                product.category,
                product.elsewhere,
              ]
                .filter(Boolean)
                .join(" · "),
              icon: categoryIconComponents[
                isOneOf(categoryIcons, product.icon) ? product.icon : "coffee"
              ],
              // Without a price there's nothing to discount.
              disabled: product.price === null,
            }))}
          />
        </Fields>
      </FormSection>

      <FormSection title="Discount">
        <Fields>
          <SelectField
            name="discount_type"
            label="Type"
            options={discountTypes.map((option) => ({
              value: option,
              label: discountTypeLabels[option],
            }))}
            value={type}
            onChange={(next) => {
              if (isOneOf(discountTypes, next)) setType(next);
            }}
          />
          <TextField
            name="discount_value"
            label={valueField.label}
            inputMode="decimal"
            placeholder={valueField.placeholder}
            hint={valueField.hint}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Fields>
        <Preview type={type} value={value} chosen={chosen} />
      </FormSection>

      <FormSection
        title="When"
        description="Dates are in Casablanca time. A product can only be in one active promotion on any day."
      >
        <Fields>
          <DateField
            name="starts_on"
            label="Starts on"
            value={startsOn}
            onChange={setStartsOn}
          />
          <DateField
            name="ends_on"
            label="Ends on"
            optional
            min={startsOn}
            defaultValue={promotion?.ends_on ?? ""}
            placeholder="No end date"
            hint="The last day of the offer."
          />
        </Fields>
        <ToggleField
          name="is_active"
          label="Active"
          description="Switch off to pause the promotion without deleting it."
          defaultChecked={promotion?.is_active ?? true}
        />
      </FormSection>
    </AdminForm>
  );
}

/** Live before/after prices, so the admin sees exactly what guests will see. */
function Preview({
  type,
  value,
  chosen,
}: {
  type: DiscountType;
  value: string;
  chosen: PromotionProduct[];
}) {
  const amount = Number(value.replace(",", "."));
  const priced = chosen.filter(
    (product): product is PromotionProduct & { price: number } =>
      product.price !== null,
  );
  if (!priced.length || !value.trim() || !(amount > 0))
    return (
      <p className={s.hint}>
        <Sparkles size={16} aria-hidden="true" />
        <span>Choose products and a discount to preview the prices.</span>
      </p>
    );
  const totals = promotionTotals(
    type,
    amount,
    priced.map((product) => product.price),
  );
  const bundle = type === "price" && priced.length > 1;
  return (
    <div className={s.preview} aria-live="polite">
      <p className={s.previewTitle}>
        Preview{" "}
        <span className={`${s.pill} ${s.pillOn}`}>
          {offerLabel(type, amount, totals.regular, priced.length)}
        </span>
      </p>
      <ul className={s.previewList}>
        {priced.map((product) => (
          <li key={product.id}>
            <span>{product.name}</span>
            <span>
              {bundle ? (
                money(product.price)
              ) : (
                <>
                  <s>{money(product.price)}</s>{" "}
                  <strong>
                    {money(discountedPrice(type, amount, product.price))}
                  </strong>
                </>
              )}
            </span>
          </li>
        ))}
        {bundle && (
          <li className={s.previewTotal}>
            <span>Together</span>
            <span>
              <s>{money(totals.regular)}</s>{" "}
              <strong>{money(totals.offer)}</strong>
            </span>
          </li>
        )}
      </ul>
      <p className={totals.saving > 0 ? s.previewSaving : s.switchError}>
        {totals.saving > 0
          ? `Guests save ${money(totals.saving)}.`
          : "This isn't cheaper than the regular price."}
      </p>
    </div>
  );
}
