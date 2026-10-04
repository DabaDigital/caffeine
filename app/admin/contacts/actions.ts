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
import { contactSchema, id } from "@/lib/validation";

export async function saveContact(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const contactId = formData.get("id")
    ? id.safeParse(formData.get("id"))
    : null;
  if (contactId && !contactId.success)
    return { message: "This contact could not be found." };

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = contactId
    ? await supabase
        .from("contacts")
        .update(parsed.data)
        .eq("id", contactId.data)
        .select("id")
    : await supabase.from("contacts").insert(parsed.data).select("id");
  if (error) return databaseError(error);
  if (!data.length) return { message: "This contact no longer exists." };

  revalidateContent("contacts");
  redirect(noticeUrl("/admin/contacts", contactId ? "updated" : "created"));
}

export async function deleteContact(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const contactId = id.safeParse(formData.get("id"));
  if (!contactId.success)
    return { message: "This contact could not be found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId.data);
  if (error) return databaseError(error);

  revalidateContent("contacts");
  redirect(noticeUrl("/admin/contacts", "deleted"));
}

export async function toggleContact(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const toggle = parseToggle(formData, ["is_active"]);
  if (!toggle.success)
    return { message: "Couldn't update. Refresh and retry." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ is_active: toggle.data.value })
    .eq("id", toggle.data.id);
  if (error) return databaseError(error);

  revalidateContent("contacts");
  return {};
}
