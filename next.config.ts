import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;
// Only the local Supabase stack (127.0.0.1) needs private-IP image fetching.
const supabaseIsLocal =
  supabase?.hostname === "127.0.0.1" || supabase?.hostname === "localhost";

const nextConfig: NextConfig = {
  // WebP keeps transparent product cutouts quick to serve on cold mobile requests.
  images: {
    formats: ["image/webp"],
    qualities: [75, 85],
    // Photos uploaded from the dashboard live in Supabase Storage.
    remotePatterns: supabase
      ? [new URL(`${supabase.origin}/storage/v1/object/public/**`)]
      : [],
    dangerouslyAllowLocalIP: supabaseIsLocal,
  },
  experimental: {
    // Dashboard image uploads (up to 5 MB) are sent through Server Actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
