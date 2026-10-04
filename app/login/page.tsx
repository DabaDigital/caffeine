import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assets } from "@/data/brand";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import s from "@/components/admin/admin.module.css";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Caffeine dashboard",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const viewer = await getViewer();
  if (viewer?.role === "admin") redirect("/admin");

  return (
    <div className={s.theme}>
      <main className={s.loginPage}>
        <div className={`${s.card} ${s.loginCard}`}>
          <header>
            <Image src={assets.mark} alt="" width={56} height={56} />
            <h1>Caffeine dashboard</h1>
            <p>Sign in to manage the menu, locations and reviews.</p>
          </header>
          {isSupabaseConfigured ? (
            <LoginForm
              next={next}
              notice={
                error === "forbidden" || viewer
                  ? "This account doesn't have dashboard access. Ask an admin to give you the admin role."
                  : undefined
              }
            />
          ) : (
            <div className={s.alert} role="alert">
              <p>
                Supabase isn’t connected yet. Add NEXT_PUBLIC_SUPABASE_URL and
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart
                the server.
              </p>
            </div>
          )}
          <p className={s.loginFoot}>
            <Link href="/">Back to the website</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
