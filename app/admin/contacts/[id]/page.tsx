import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { ContactForm } from "@/components/admin/forms/ContactForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteContact } from "../actions";

export const metadata: Metadata = { title: "Edit contact" };

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, type, label, value, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!contact) notFound();

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/contacts", label: "Contact" }}
        eyebrow="Edit contact"
        title={contact.value}
      />
      <ContactForm contact={contact} />
      <DangerZone
        title="Delete this contact"
        description="It disappears from the homepage footer."
      >
        <DeleteButton
          action={deleteContact}
          id={contact.id}
          name={contact.value}
          what="contact"
          variant="button"
        />
      </DangerZone>
    </div>
  );
}
