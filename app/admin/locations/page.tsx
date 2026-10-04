import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPinned, Pencil, Plus, Store } from "lucide-react";
import { AddLink, EmptyState, PageHeader } from "@/components/admin/Page";
import { Notice } from "@/components/admin/Notice";
import { DeleteButton, ToggleSwitch } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/auth";
import { summarizeHours } from "@/lib/site";
import { parseHours } from "@/lib/validation";
import { displayableImage } from "@/lib/images";
import { rows } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { deleteLocation, toggleLocation } from "./actions";

export const metadata: Metadata = { title: "Locations" };

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; n?: string }>;
}) {
  await requireAdmin();
  const { notice, n } = await searchParams;
  const supabase = await createClient();
  const locations = await supabase
    .from("locations")
    .select("id, name, area, city, address, hours, image_url, is_active")
    .order("sort_order")
    .order("name")
    .then(rows);
  const primaryId = locations.find((location) => location.is_active)?.id;

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Café"
        title="Locations"
        description="Where guests can find you. The first visible location is featured on the homepage."
        actions={
          <AddLink href="/admin/locations/new">
            <Plus size={17} aria-hidden="true" /> Add location
          </AddLink>
        }
      />
      <Notice key={n} notice={notice} item="Location" />
      {locations.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No locations yet"
          action={
            <AddLink href="/admin/locations/new">
              <Plus size={17} aria-hidden="true" /> Add your café
            </AddLink>
          }
        >
          Add your address and opening hours so visitors know where to find you.
        </EmptyState>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Location</th>
              <th scope="col">Address</th>
              <th scope="col">Hours</th>
              <th scope="col">Visible</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => {
              const image = displayableImage(location.image_url);
              const hours = parseHours(location.hours);
              return (
                <tr key={location.id}>
                  <td className={s.cellMain}>
                    <div className={s.itemTitle}>
                      <span className={s.thumb}>
                        {image ? (
                          <Image src={image} alt="" fill sizes="56px" />
                        ) : (
                          <Store size={22} aria-hidden="true" />
                        )}
                      </span>
                      <div>
                        <Link href={`/admin/locations/${location.id}`}>
                          <strong>{location.name}</strong>
                        </Link>
                        <span>
                          {[location.area, location.city]
                            .filter(Boolean)
                            .join(", ")}
                          {location.id === primaryId
                            ? " · Featured on homepage"
                            : ""}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Address">
                    {location.address || (
                      <span className={s.muted}>Not added yet</span>
                    )}
                  </td>
                  <td data-label="Hours">
                    {hours ? (
                      <span className={s.hoursSummary}>
                        {summarizeHours(hours).map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </span>
                    ) : (
                      <span className={s.muted}>Not added yet</span>
                    )}
                  </td>
                  <td data-label="Visible">
                    <ToggleSwitch
                      action={toggleLocation}
                      id={location.id}
                      field="is_active"
                      checked={location.is_active}
                      label={`Show ${location.name} on the website`}
                    />
                  </td>
                  <td className={s.cellActions}>
                    <div className={s.actions}>
                      <Link
                        href={`/admin/locations/${location.id}`}
                        className={s.iconButton}
                        aria-label={`Edit ${location.name}`}
                      >
                        <Pencil size={17} />
                      </Link>
                      <DeleteButton
                        action={deleteLocation}
                        id={location.id}
                        name={location.name}
                        what="location"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
