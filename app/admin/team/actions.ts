"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { databaseError } from "@/lib/admin";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { roleSchema } from "@/lib/validation";

export async function setRole(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireAdmin();
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { message: "Couldn't change the role. Refresh and retry." };
  // Prevents locking yourself out by accident; the database also refuses to
  // remove the last admin.
  if (parsed.data.userId === viewer.id)
    return { message: "You can't change your own role. Ask another admin." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .select("id");
  if (error) return databaseError(error);
  if (!data.length) return { message: "This account no longer exists." };

  revalidatePath("/admin/team");
  revalidatePath("/admin");
  return {};
}
