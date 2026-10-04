"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  databaseError,
  invalid,
  noticeUrl,
  parseToggle,
  revalidateContent,
} from "@/lib/admin";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { id, socialLinkSchema } from "@/lib/validation";

export async function saveSocialLink(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const linkId = formData.get("id") ? id.safeParse(formData.get("id")) : null;
  if (linkId && !linkId.success)
    return { message: "This link could not be found." };

  const parsed = socialLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = linkId
    ? await supabase
        .from("social_links")
        .update(parsed.data)
        .eq("id", linkId.data)
        .select("id")
    : await supabase.from("social_links").insert(parsed.data).select("id");
  if (error) return databaseError(error);
  if (!data.length) return { message: "This link no longer exists." };

  revalidateContent("social-links");
  redirect(noticeUrl("/admin/social-links", linkId ? "updated" : "created"));
}

export async function deleteSocialLink(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const linkId = id.safeParse(formData.get("id"));
  if (!linkId.success) return { message: "This link could not be found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_links")
    .delete()
    .eq("id", linkId.data);
  if (error) return databaseError(error);

  revalidateContent("social-links");
  redirect(noticeUrl("/admin/social-links", "deleted"));
}

export async function toggleSocialLink(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_active"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_links")
    .update({ is_active: toggle.data.value })
    .eq("id", toggle.data.id);
  if (error) return databaseError(error);

  revalidateContent("social-links");
  return {};
}
