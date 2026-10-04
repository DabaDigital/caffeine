"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email({ error: "Enter the email you sign in with." }),
  password: z.string().min(1, "Enter your password."),
});

/** Only same-site dashboard paths, so the login can't redirect elsewhere. */
function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^\/admin(\/[\w-]*)*$/.test(value)
    ? value
    : "/admin";
}

export async function signIn(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return {
      message: "Please fix the highlighted fields.",
      errors: z.flattenError(parsed.error).fieldErrors,
    };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      message:
        error.code === "invalid_credentials"
          ? "That email and password don't match an account."
          : error.code === "email_not_confirmed"
            ? "Confirm your email address first, then sign in."
            : error.status === 429
              ? "Too many attempts. Wait a minute and try again."
              : "Sign in failed. Please try again.",
    };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError?.code === "PGRST205") {
    await supabase.auth.signOut({ scope: "local" });
    return {
      message:
        "The database isn't set up yet. Run the SQL in supabase/migrations in the Supabase SQL editor, then sign in again.",
    };
  }
  if (profile?.role !== "admin") {
    // Non-admins never keep a dashboard session.
    await supabase.auth.signOut({ scope: "local" });
    return {
      message:
        "This account doesn't have dashboard access. Ask an admin to give you the admin role.",
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
