import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DangerZone, PageHeader } from "@/components/admin/Page";
import { DeleteButton } from "@/components/admin/controls";
import { LocationForm } from "@/components/admin/forms/LocationForm";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { id as idSchema, parseHours } from "@/lib/validation";
import s from "@/components/admin/admin.module.css";
import { deleteLocation } from "../actions";

export const metadata: Metadata = { title: "Edit location" };

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: location, error } = await supabase
    .from("locations")
    .select(
      "id, name, area, city, address, phone, hours, hours_note, map_url, image_url, sort_order, is_active",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!location) notFound();

  return (
    <div className={s.page}>
      <PageHeader
        back={{ href: "/admin/locations", label: "Locations" }}
        eyebrow="Edit location"
        title={location.name}
      />
      <LocationForm
        location={{ ...location, hours: parseHours(location.hours) }}
      />
      <DangerZone
        title="Delete this location"
        description="It disappears from the homepage. Its uploaded photo is deleted too."
      >
        <DeleteButton
          action={deleteLocation}
          id={location.id}
          name={location.name}
          what="location"
          variant="button"
        />
      </DangerZone>
    </div>
  );
}
