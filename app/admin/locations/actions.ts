"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  databaseError,
  invalid,
  noticeUrl,
  parseToggle,
  readImage,
  removeImage,
  resolveImage,
  revalidateContent,
} from "@/lib/admin";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { id, locationSchema } from "@/lib/validation";

export async function saveLocation(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const locationId = formData.get("id")
    ? id.safeParse(formData.get("id"))
    : null;
  if (locationId && !locationId.success)
    return { message: "This location could not be found." };

  const parsed = locationSchema.safeParse(Object.fromEntries(formData));
  const imageCheck = readImage(formData);
  if (!parsed.success || imageCheck.error)
    return invalid(parsed.error, { image: imageCheck.error });

  const supabase = await createClient();
  let current: string | null = null;
  if (locationId) {
    const { data, error } = await supabase
      .from("locations")
      .select("image_url")
      .eq("id", locationId.data)
      .maybeSingle();
    if (error) return databaseError(error);
    if (!data) return { message: "This location no longer exists." };
    current = data.image_url;
  }

  const image = await resolveImage(supabase, formData, "locations", current);
  if ("error" in image) return invalid(undefined, { image: image.error });

  const values = { ...parsed.data, image_url: image.url };
  const { error } = locationId
    ? await supabase.from("locations").update(values).eq("id", locationId.data)
    : await supabase.from("locations").insert(values);
  if (error) {
    await image.rollback();
    return databaseError(error);
  }
  await image.commit();

  revalidateContent("locations");
  redirect(noticeUrl("/admin/locations", locationId ? "updated" : "created"));
}

export async function deleteLocation(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const locationId = id.safeParse(formData.get("id"));
  if (!locationId.success)
    return { message: "This location could not be found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId.data)
    .select("image_url")
    .maybeSingle();
  if (error) return databaseError(error);
  if (data) await removeImage(supabase, data.image_url);

  revalidateContent("locations");
  redirect(noticeUrl("/admin/locations", "deleted"));
}

export async function toggleLocation(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_active"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({ is_active: toggle.data.value })
    .eq("id", toggle.data.id);
  if (error) return databaseError(error);

  revalidateContent("locations");
  return {};
}
