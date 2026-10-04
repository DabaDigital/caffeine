import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";

export type Viewer = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Enums<"app_role">;
};

/** The signed-in user, with the role stored in the database. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  // getClaims verifies the JWT signature instead of trusting the cookie.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  };
});

/**
 * Gate for every dashboard page and Server Action. Layouts do not re-run on
 * navigation, so each entry point calls this itself; RLS repeats the check.
 */
export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "admin") redirect("/login?error=forbidden");
  return viewer;
}
