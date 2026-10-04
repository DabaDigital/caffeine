"use client";

import { useState } from "react";
import {
  AdminForm,
  Fields,
  FormSection,
  PhoneField,
  SelectField,
  TextField,
  ToggleField,
} from "@/components/admin/form";
import { saveContact } from "@/app/admin/contacts/actions";
import { contactIconComponents } from "@/components/icons";
import {
  contactTypeLabels,
  contactTypes,
  isOneOf,
  type ContactType,
} from "@/lib/site";
import type { Tables } from "@/lib/supabase/database.types";

type Contact = Pick<
  Tables<"contacts">,
  "id" | "type" | "label" | "value" | "sort_order" | "is_active"
>;

const valueField: Record<ContactType, { label: string; hint: string }> = {
  phone: {
    label: "Phone number",
    hint: "Tapping it on a phone starts a call.",
  },
  whatsapp: {
    label: "WhatsApp number",
    hint: "Opens a WhatsApp chat with this number.",
  },
  email: {
    label: "Email address",
    hint: "Opens the guest's email app.",
  },
};

export function ContactForm({
  contact,
  defaultSortOrder = 0,
}: {
  contact?: Contact;
  defaultSortOrder?: number;
}) {
  const [type, setType] = useState<ContactType>(
    contact && isOneOf(contactTypes, contact.type) ? contact.type : "phone",
  );
  const field = valueField[type];

  return (
    <AdminForm
      action={saveContact}
      submitLabel={contact ? "Save changes" : "Add contact"}
      cancelHref="/admin/contacts"
    >
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <FormSection
        title="Contact detail"
        description="Shown in the homepage footer so guests can reach you."
      >
        <Fields>
          <SelectField
            name="type"
            label="Type"
            options={contactTypes.map((value) => ({
              value,
              label: contactTypeLabels[value],
              icon: contactIconComponents[value],
            }))}
            value={type}
            onChange={(next) => {
              if (isOneOf(contactTypes, next)) setType(next);
            }}
          />
          <TextField
            name="label"
            label="Label"
            optional
            maxLength={60}
            defaultValue={contact?.label ?? ""}
            placeholder="Reservations"
            hint="A short note shown above the value."
          />
          {type === "email" ? (
            <TextField
              key={type}
              name="value"
              label={field.label}
              type="email"
              maxLength={120}
              defaultValue={contact?.type === type ? contact.value : ""}
              placeholder="hello@example.com"
              hint={field.hint}
            />
          ) : (
            <PhoneField
              key={type}
              name="value"
              label={field.label}
              defaultValue={contact?.type === type ? contact.value : ""}
              hint={field.hint}
            />
          )}
          <TextField
            name="sort_order"
            label="Display order"
            optional
            type="number"
            min={0}
            max={9999}
            defaultValue={contact?.sort_order ?? defaultSortOrder}
            hint="Lower numbers appear first."
          />
        </Fields>
        <ToggleField
          name="is_active"
          label="Visible on the website"
          description="Hidden contacts stay saved here."
          defaultChecked={contact?.is_active ?? true}
        />
      </FormSection>
    </AdminForm>
  );
}
