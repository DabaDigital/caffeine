"use client";

import {
  AdminForm,
  Fields,
  FormSection,
  HoursField,
  ImageField,
  PhoneField,
  TextField,
  ToggleField,
} from "@/components/admin/form";
import { saveLocation } from "@/app/admin/locations/actions";
import type { WeekHours } from "@/lib/site";
import type { Tables } from "@/lib/supabase/database.types";

type Location = Pick<
  Tables<"locations">,
  | "id"
  | "name"
  | "area"
  | "city"
  | "address"
  | "phone"
  | "hours_note"
  | "map_url"
  | "image_url"
  | "sort_order"
  | "is_active"
> & { hours: WeekHours | null };

export function LocationForm({
  location,
  defaultSortOrder = 0,
}: {
  location?: Location;
  defaultSortOrder?: number;
}) {
  return (
    <AdminForm
      action={saveLocation}
      submitLabel={location ? "Save changes" : "Add location"}
      cancelHref="/admin/locations"
    >
      {location && <input type="hidden" name="id" value={location.id} />}
      <FormSection
        title="The place"
        description="The first visible location is featured in the homepage hero and “Find us” section."
      >
        <ImageField
          label="Photo"
          current={location?.image_url ?? null}
          hint="A storefront or interior photo. JPG, PNG, WebP or AVIF, up to 5 MB."
        />
        <Fields>
          <TextField
            name="name"
            label="Name"
            maxLength={80}
            defaultValue={location?.name}
            placeholder="Caffeine Maarif"
          />
          <TextField
            name="area"
            label="Neighborhood"
            optional
            maxLength={80}
            defaultValue={location?.area ?? ""}
            placeholder="Maarif"
          />
          <TextField
            name="city"
            label="City"
            maxLength={80}
            defaultValue={location?.city ?? ""}
            placeholder="Casablanca"
          />
          <TextField
            name="address"
            label="Street address"
            optional
            maxLength={200}
            defaultValue={location?.address ?? ""}
          />
        </Fields>
      </FormSection>

      <FormSection
        title="Opening hours"
        description="Shown like Google Maps, with “Open now” on the homepage. Times are in Casablanca time."
      >
        <HoursField
          name="hours"
          label="Weekly hours"
          defaultValue={location?.hours ?? null}
        />
        <Fields>
          <TextField
            name="hours_note"
            label="Note under the hours"
            optional
            wide
            maxLength={400}
            defaultValue={location?.hours_note ?? ""}
            placeholder="Hours may differ on public holidays and during Ramadan."
          />
        </Fields>
      </FormSection>

      <FormSection title="Visiting details">
        <Fields>
          <PhoneField
            name="phone"
            label="Phone"
            optional
            defaultValue={location?.phone ?? ""}
            hint="Guests can tap it to call."
          />
          <TextField
            name="sort_order"
            label="Display order"
            optional
            type="number"
            min={0}
            max={9999}
            defaultValue={location?.sort_order ?? defaultSortOrder}
            hint="Lower numbers appear first."
          />
          <TextField
            name="map_url"
            label="Google Maps link"
            optional
            wide
            type="url"
            inputMode="url"
            defaultValue={location?.map_url ?? ""}
            placeholder="https://maps.app.goo.gl/…"
            hint="Paste the Share link from Google Maps. It pins the place on the homepage map. Without it, the site shows the photo and opens a Maps search for the name."
          />
        </Fields>
        <ToggleField
          name="is_active"
          label="Visible on the website"
          description="Hidden locations stay saved here."
          defaultChecked={location?.is_active ?? true}
        />
      </FormSection>
    </AdminForm>
  );
}
