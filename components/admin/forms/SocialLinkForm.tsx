"use client";

import {
  AdminForm,
  Fields,
  FormSection,
  SelectField,
  TextField,
  ToggleField,
} from "@/components/admin/form";
import { saveSocialLink } from "@/app/admin/social-links/actions";
import { socialIconComponents } from "@/components/icons";
import { socialPlatformLabels, socialPlatforms } from "@/lib/site";
import type { Tables } from "@/lib/supabase/database.types";

type SocialLink = Pick<
  Tables<"social_links">,
  "id" | "platform" | "label" | "url" | "sort_order" | "is_active"
>;

export function SocialLinkForm({
  link,
  defaultSortOrder = 0,
}: {
  link?: SocialLink;
  defaultSortOrder?: number;
}) {
  return (
    <AdminForm
      action={saveSocialLink}
      submitLabel={link ? "Save changes" : "Add link"}
      cancelHref="/admin/social-links"
    >
      {link && <input type="hidden" name="id" value={link.id} />}
      <FormSection
        title="Social link"
        description="The first visible link is shown large in the footer; the rest appear as buttons beside your contact details."
      >
        <Fields>
          <SelectField
            name="platform"
            label="Platform"
            options={socialPlatforms.map((platform) => ({
              value: platform,
              label: socialPlatformLabels[platform],
              icon: socialIconComponents[platform],
            }))}
            placeholder="Choose a platform"
            defaultValue={link?.platform ?? ""}
          />
          <TextField
            name="label"
            label="Display name"
            optional
            maxLength={60}
            defaultValue={link?.label ?? ""}
            placeholder="@caffeinemaarif"
            hint="Defaults to the platform name."
          />
          <TextField
            name="url"
            label="Link"
            wide
            type="url"
            inputMode="url"
            maxLength={300}
            defaultValue={link?.url ?? ""}
            placeholder="https://www.instagram.com/caffeinemaarif/"
          />
          <TextField
            name="sort_order"
            label="Display order"
            optional
            type="number"
            min={0}
            max={9999}
            defaultValue={link?.sort_order ?? defaultSortOrder}
            hint="Lower numbers appear first."
          />
        </Fields>
        <ToggleField
          name="is_active"
          label="Visible on the website"
          description="Hidden links stay saved here."
          defaultChecked={link?.is_active ?? true}
        />
      </FormSection>
    </AdminForm>
  );
}
