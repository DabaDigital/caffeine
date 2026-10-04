import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/Page";
import { ContactForm } from "@/components/admin/forms/ContactForm";
import { requireAdmin } from "@/lib/auth";
import { nextSortOrder } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: "Add contact" };

export default async function NewContactPage() {
  await requireAdmin();
  const sortOrder = await nextSortOrder(await createClient(), "contacts");
  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/contacts", label: "Contact" }}
        eyebrow="Café"
        title="Add a contact detail"
      />
      <ContactForm defaultSortOrder={sortOrder} />
    </div>
  );
}
