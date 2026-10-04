import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// The public homepage reads cached, cookie-free data, so only the dashboard
// and login need session handling.
export const config = {
  matcher: ["/admin/:path*", "/login"],
};
