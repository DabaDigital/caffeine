import "server-only";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { FormState } from "@/lib/form-state";

type Client = SupabaseClient<Database>;

export function invalid(
  error: z.ZodError | undefined,
  extra: Record<string, string | undefined> = {},
): FormState {
  const errors: Record<string, string[] | undefined> = error
    ? { ...z.flattenError(error).fieldErrors }
    : {};
  for (const [field, message] of Object.entries(extra))
    if (message) errors[field] = [message];
  return { message: "Please fix the highlighted fields.", errors };
}

const friendlyErrors: Record<string, string> = {
  "23505": "That already exists. Try a different name.",
  "23503": "This item is still in use, so it can't be removed.",
  "23514": "Some values aren't allowed. Check the fields and try again.",
  "42501": "You don't have permission to do that.",
};

/** Turns a Postgres/PostgREST error into a message an admin can act on. */
export function databaseError(
  error: { code?: string; message: string },
  overrides: Record<string, string> = {},
): FormState {
  // Messages raised by our own triggers are written for people.
  if (error.code === "P0001") return { message: error.message };
  const message =
    overrides[error.code ?? ""] ?? friendlyErrors[error.code ?? ""];
  if (!message) console.error("Dashboard database error", error);
  return {
    message: message ?? "Something went wrong while saving. Please try again.",
  };
}

/** Rows from a list query; failures surface in the dashboard error boundary. */
export function rows<T>(result: {
  data: T[] | null;
  error: { message: string } | null;
}): T[] {
  if (result.error)
    throw new Error(`Could not load dashboard data: ${result.error.message}`);
  return result.data ?? [];
}

/** Display order for a new item, so it joins the end instead of jumping ahead. */
export async function nextSortOrder(
  supabase: Client,
  table: "categories" | "products" | "locations" | "social_links" | "contacts",
) {
  const { data } = await supabase
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Math.min((data?.sort_order ?? 0) + 1, 9999);
}

/** List URL that shows a one-time success notice (`n` keeps repeats distinct). */
export function noticeUrl(
  path: string,
  notice: "created" | "updated" | "deleted" | "approved" | "declined",
) {
  return `${path}?notice=${notice}&n=${Date.now().toString(36)}`;
}

/** Refreshes the cached homepage and the dashboard pages that list this data. */
export function revalidateContent(section: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${section}`);
}

// ---------------------------------------------------------------------------
// Images: uploaded to the public `media` bucket, which only admins can write.
// ---------------------------------------------------------------------------

const MEDIA_BUCKET = "media";
const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function readImage(formData: FormData, field = "image") {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return { file: null };
  if (!imageExtensions[file.type])
    return { file: null, error: "Use a JPG, PNG, WebP or AVIF image." };
  if (file.size > MAX_IMAGE_BYTES)
    return { file: null, error: "Images must be 5 MB or smaller." };
  return { file };
}

export async function uploadImage(
  supabase: Client,
  file: File,
  folder: string,
) {
  const path = `${folder}/${crypto.randomUUID()}.${imageExtensions[file.type]}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      // File names are unique, so browsers and CDNs may cache them for a year.
      cacheControl: "31536000",
    });
  if (error) {
    console.error("Image upload failed", error);
    return null;
  }
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Deletes an uploaded image. Site assets such as /assets/… are left alone. */
export async function removeImage(supabase: Client, url: string | null) {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const start = url?.indexOf(marker) ?? -1;
  if (!url || start === -1) return;
  const path = decodeURIComponent(url.slice(start + marker.length));
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) console.error("Could not delete image", path, error);
}

/**
 * Works out a row's image after a save: a new upload, a removal, or the
 * current one. Call `commit` once the row is saved, or `rollback` if not.
 */
export async function resolveImage(
  supabase: Client,
  formData: FormData,
  folder: string,
  current: string | null,
) {
  const { file, error } = readImage(formData);
  if (error) return { error } as const;
  let url = formData.get("remove_image") === "on" ? null : current;
  let uploaded: string | null = null;
  if (file) {
    uploaded = await uploadImage(supabase, file, folder);
    if (!uploaded)
      return {
        error: "The image couldn't be uploaded. Please try again.",
      } as const;
    url = uploaded;
  }
  return {
    url,
    commit: () =>
      url === current ? Promise.resolve() : removeImage(supabase, current),
    rollback: () => removeImage(supabase, uploaded),
  } as const;
}

// ---------------------------------------------------------------------------
// Quick on/off switches in the dashboard lists.
// ---------------------------------------------------------------------------

export function parseToggle<const Field extends string>(
  formData: FormData,
  fields: readonly [Field, ...Field[]],
) {
  return z
    .object({
      id: z.guid(),
      field: z.enum(fields),
      value: z.enum(["true", "false"]).transform((value) => value === "true"),
    })
    .safeParse(Object.fromEntries(formData));
}
