import { supabaseUrl } from "@/lib/supabase/env";

const storagePrefix = supabaseUrl
  ? `${new URL(supabaseUrl).origin}/storage/v1/object/public/`
  : null;

/**
 * next/image only serves site assets and Supabase Storage (see next.config.ts)
 * and throws on any other host, so other URLs are treated as "no photo".
 */
export function displayableImage(url: string | null) {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return storagePrefix && url.startsWith(storagePrefix) ? url : null;
}
