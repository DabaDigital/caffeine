import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/Page";
import { LocationForm } from "@/components/admin/forms/LocationForm";
import { requireAdmin } from "@/lib/auth";
import { nextSortOrder } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: "Add location" };

export default async function NewLocationPage() {
  await requireAdmin();
  const sortOrder = await nextSortOrder(await createClient(), "locations");
  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/locations", label: "Locations" }}
        eyebrow="Café"
        title="Add a location"
      />
      <LocationForm defaultSortOrder={sortOrder} />
    </div>
  );
}
