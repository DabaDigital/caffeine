import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = {
  title: { template: "%s | Caffeine dashboard", default: "Caffeine dashboard" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pages and Server Actions check the role again: layouts don't re-run on
  // client navigation.
  const viewer = await requireAdmin();
  return (
    <div className={`${s.theme} ${s.shell}`}>
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <AdminNav viewer={{ email: viewer.email, fullName: viewer.fullName }} />
      <main id="admin-main" className={s.main}>
        {children}
      </main>
    </div>
  );
}
