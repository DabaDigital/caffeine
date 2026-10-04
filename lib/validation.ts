import * as z from "zod";
import { toE164 } from "@/lib/phone";
import {
  categoryIcons,
  contactTypes,
  discountTypes,
  socialPlatforms,
  weekDayNames,
  weekDays,
  type WeekDay,
  type WeekHours,
} from "@/lib/site";

// FormData gives strings (or nothing, for unchecked boxes). These helpers turn
// that into clean values; limits mirror the database check constraints.

const text = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().trim().max(max, `Use ${max} characters or fewer.`),
  );
const required = (label: string, max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z
      .string()
      .trim()
      .min(1, `${label} is required.`)
      .max(max, `Use ${max} characters or fewer.`),
  );
const optional = (max: number) => text(max).transform((value) => value || null);
const flag = z.preprocess((value) => value === "on", z.boolean());
const sortOrder = z.preprocess(
  (value) => (value === "" || value == null ? 0 : value),
  z.coerce
    .number({ error: "Use a whole number." })
    .int("Use a whole number.")
    .min(0, "Use 0 or more.")
    .max(9999, "Use 9999 or less."),
);
const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname.includes(".")
    );
  } catch {
    return false;
  }
};
const optionalUrl = (label: string) =>
  optional(300).refine(
    (value) => value === null || isHttpUrl(value),
    `${label} must be a full link starting with https://`,
  );

const phoneMessage = "Enter a valid phone number, e.g. 06 12 34 56 78.";
/** Optional phone, checked with libphonenumber and stored as +212… */
const optionalPhone = optional(40)
  .refine((value) => value === null || toE164(value) !== null, phoneMessage)
  .transform((value) => (value === null ? null : (toE164(value) ?? value)));

// ---------- Opening hours ----------

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 07:30.");
const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const dayPeriods = z
  .array(z.object({ open: time, close: time }))
  .max(3, "Use up to three periods a day.");
export const weekHoursSchema = z
  .object(
    Object.fromEntries(weekDays.map((day) => [day, dayPeriods])) as Record<
      WeekDay,
      typeof dayPeriods
    >,
  )
  .superRefine((week, context) => {
    for (const day of weekDays) {
      const periods = week[day];
      if (periods.some(({ open, close }) => open === close))
        context.addIssue({
          code: "custom",
          message: `${weekDayNames[day]}: opening and closing times can't be the same.`,
        });
      // A close at or before the open time runs past midnight.
      const spans = periods
        .map(({ open, close }) => {
          const start = toMinutes(open);
          const end = toMinutes(close);
          return [start, end <= start ? end + 1440 : end];
        })
        .sort((a, b) => a[0] - b[0]);
      if (
        spans.some((span, index) => index > 0 && span[0] < spans[index - 1][1])
      )
        context.addIssue({
          code: "custom",
          message: `${weekDayNames[day]}: the opening hours overlap.`,
        });
    }
  });
/** The hours editor submits JSON, or "" when hours aren't published. */
const hoursField = z.preprocess((value) => {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return "invalid";
  }
}, weekHoursSchema.nullable());

/** Stored hours JSON as a typed week, or null when unset or malformed. */
export function parseHours(value: unknown): WeekHours | null {
  const result = weekHoursSchema.safeParse(value);
  return result.success ? result.data : null;
}

export const id = z.guid({ error: "Missing or invalid id." });

export const categorySchema = z.object({
  name: required("Name", 60),
  description: optional(300),
  icon: z.enum(categoryIcons, { error: "Choose an icon." }),
  sort_order: sortOrder,
  is_active: flag,
});

export const productSchema = z.object({
  name: required("Name", 80),
  category_id: z.guid({ error: "Choose a category." }),
  description: optional(200),
  details: optional(1000),
  price: z.preprocess(
    (value) =>
      typeof value !== "string" || value.trim() === ""
        ? null
        : value.replace(",", "."),
    z.coerce
      .number({ error: "Enter a price like 35 or 35.50." })
      .min(0, "Price can't be negative.")
      .max(100000, "That price looks too high.")
      .transform((value) => Math.round(value * 100) / 100)
      .nullable(),
  ),
  badge: optional(40),
  highlight_word: optional(16),
  tagline: optional(80),
  ingredients: z.preprocess(
    (value) =>
      typeof value === "string"
        ? value
            .split(",")
            .map((note) => note.trim())
            .filter(Boolean)
        : [],
    z
      .array(z.string().max(30, "Keep each flavor note under 30 characters."))
      .max(8, "Use up to 8 flavor notes."),
  ),
  is_featured: flag,
  is_available: flag,
  sort_order: sortOrder,
});

export const locationSchema = z.object({
  name: required("Name", 80),
  area: optional(80),
  city: required("City", 80),
  address: optional(200),
  phone: optionalPhone,
  hours: hoursField,
  hours_note: optional(400),
  map_url: optionalUrl("Map link"),
  sort_order: sortOrder,
  is_active: flag,
});

export const socialLinkSchema = z.object({
  platform: z.enum(socialPlatforms, { error: "Choose a platform." }),
  label: optional(60),
  url: required("Link", 300).refine(
    isHttpUrl,
    "Link must be a full address starting with https://",
  ),
  sort_order: sortOrder,
  is_active: flag,
});

export const contactSchema = z
  .object({
    type: z.enum(contactTypes, { error: "Choose a contact type." }),
    label: optional(60),
    value: required("Value", 120),
    sort_order: sortOrder,
    is_active: flag,
  })
  .superRefine((contact, context) => {
    const valid =
      contact.type === "email"
        ? z.email().safeParse(contact.value).success
        : toE164(contact.value) !== null;
    if (!valid)
      context.addIssue({
        code: "custom",
        path: ["value"],
        message:
          contact.type === "email"
            ? "Enter a valid email address."
            : phoneMessage,
      });
  })
  // Phone and WhatsApp numbers are stored as +212…
  .transform((contact) =>
    contact.type === "email"
      ? contact
      : { ...contact, value: toE164(contact.value) ?? contact.value },
  );

export const reviewSchema = z.object({
  author_name: required("Name", 80),
  rating: z.coerce
    .number({ error: "Choose a rating from 1 to 5." })
    .int("Choose a rating from 1 to 5.")
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  comment: required("Review", 1000),
  source: optional(40),
  reviewed_on: z.preprocess(
    (value) => (typeof value === "string" && value ? value : null),
    z.iso
      .date({ error: "Use a valid date." })
      .refine(
        (value) => value <= new Date().toISOString().slice(0, 10),
        "The date can't be in the future.",
      )
      .nullable(),
  ),
  is_published: flag,
});

export const promotionSchema = z
  .object({
    title: required("Title", 80),
    description: optional(300),
    discount_type: z.enum(discountTypes, { error: "Choose a discount type." }),
    discount_value: z.preprocess(
      (value) =>
        typeof value === "string" ? value.replace(",", ".").trim() : value,
      z.coerce
        .number({ error: "Enter a number." })
        .positive("Enter a value above 0.")
        .max(100000, "That looks too high.")
        .transform((value) => Math.round(value * 100) / 100),
    ),
    starts_on: z.iso.date({ error: "Choose a start date." }),
    ends_on: z.preprocess(
      (value) => (typeof value === "string" && value ? value : null),
      z.iso.date({ error: "Use a valid date." }).nullable(),
    ),
    is_active: flag,
    product_ids: z
      .array(z.guid())
      .min(1, "Choose at least one product.")
      .max(50, "Choose up to 50 products."),
  })
  .superRefine((promotion, context) => {
    if (promotion.discount_type === "percent" && promotion.discount_value > 100)
      context.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "A percentage can't be more than 100.",
      });
    if (promotion.ends_on && promotion.ends_on < promotion.starts_on)
      context.addIssue({
        code: "custom",
        path: ["ends_on"],
        message: "The end date must be on or after the start date.",
      });
  });

export const roleSchema = z.object({
  userId: id,
  role: z.enum(["admin", "user"], { error: "Choose a role." }),
});
