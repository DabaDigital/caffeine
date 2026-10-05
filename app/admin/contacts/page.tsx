import { Pagination } from "@/components/admin/Pagination";
import { paginate } from "@/lib/pagination";
import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Phone, Plus } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import { DeleteButton, ToggleSwitch } from "@/components/admin/controls";
import { contactIconComponents } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { contactHref, formatPhone } from "@/lib/phone";
import { contactTypeLabels, contactTypes, isOneOf } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteContact, toggleContact } from "./actions";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; notice?: string; n?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const { notice, n } = params;
  const supabase = await createClient();
  const contacts = await supabase
    .from("contacts")
    .select("id, type, label, value, is_active")
    .order("sort_order")
    .order("created_at")
    .order("id")
    .then(rows);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Café"
        title="Contact"
        description="Phone, WhatsApp and email, shown in the homepage footer. Location phone numbers are set on each location."
        actions={
          <AddLink href="/admin/contacts/new">
            <Plus size={17} aria-hidden="true" /> Add contact
          </AddLink>
        }
      />
      <Notice key={n} notice={notice} item="Contact" />
      {contacts.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No contact details yet"
          action={
            <AddLink href="/admin/contacts/new">
              <Plus size={17} aria-hidden="true" /> Add a phone or email
            </AddLink>
          }
        >
          Let guests call, message or email you for reservations and events.
        </EmptyState>
      ) : (
        <>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Shown as</th>
                <th scope="col">Visible</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginate(contacts, params.page).items.map((contact) => {
                const type = isOneOf(contactTypes, contact.type)
                  ? contact.type
                  : "phone";
                const Icon = contactIconComponents[type];
                return (
                  <tr key={contact.id}>
                    <td className={s.cellMain}>
                      <div className={s.itemTitle}>
                        <span className={`${s.thumb} ${s.thumbRound}`}>
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <div>
                          <Link href={`/admin/contacts/${contact.id}`}>
                            <strong>{contactTypeLabels[type]}</strong>
                          </Link>
                          <span>{contact.label || "No label"}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Shown as">
                      <a href={contactHref(type, contact.value)}>
                        {type === "email"
                          ? contact.value
                          : formatPhone(contact.value)}
                      </a>
                    </td>
                    <td data-label="Visible">
                      <ToggleSwitch
                        action={toggleContact}
                        id={contact.id}
                        field="is_active"
                        checked={contact.is_active}
                        label={`Show ${contact.value} on the website`}
                      />
                    </td>
                    <td className={s.cellActions}>
                      <div className={s.actions}>
                        <Link
                          href={`/admin/contacts/${contact.id}`}
                          className={s.iconButton}
                          aria-label={`Edit ${contact.value}`}
                        >
                          <Pencil size={17} />
                        </Link>
                        <DeleteButton
                          action={deleteContact}
                          id={contact.id}
                          name={contact.value}
                          what="contact"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            pagination={paginate(contacts, params.page)}
            pathname="/admin/contacts"
            searchParams={params}
          />
        </>
      )}
    </div>
  );
}
