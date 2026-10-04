import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/**
 * Cookie-free client for public pages. It reads only rows that row level
 * security exposes to visitors, so the homepage can be statically cached.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createClient<Database>(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
