import type { CSSProperties } from "react";
import s from "./admin.module.css";

// Loading states mirror each page's real layout, so content settles in place.

export function Skeleton({
  width = "100%",
  height = 14,
  shape,
  style,
}: {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  shape?: "circle" | "pill";
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${s.skeleton} ${shape === "circle" ? s.skeletonCircle : shape === "pill" ? s.skeletonPill : ""}`}
      style={{ width, height, ...style }}
    />
  );
}

function Loading({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={s.page} role="status" aria-busy="true">
      <span className="sr-only">Loading {label}…</span>
      {children}
    </div>
  );
}

function HeaderSkeleton({
  action = true,
  back = false,
}: {
  action?: boolean;
  back?: boolean;
}) {
  return (
    <>
      {back && (
        <Skeleton width={110} height={16} style={{ marginBottom: -6 }} />
      )}
      <div className={s.pageHeader}>
        <div className={s.skeletonStack} style={{ maxWidth: 520 }}>
          <Skeleton width={90} height={12} />
          <Skeleton width="min(320px, 70%)" height={44} />
          <Skeleton width="min(480px, 90%)" height={14} />
        </div>
        {action && <Skeleton width={150} height={44} shape="pill" />}
      </div>
    </>
  );
}

type Cell =
  | { kind: "media"; media: "thumb" | "avatar" | "icon" }
  | { kind: "text"; label: string; width?: number; lines?: number }
  | { kind: "pill"; label: string }
  | { kind: "switch"; label: string }
  | { kind: "stars"; label: string }
  | { kind: "actions" };

function CellSkeleton({ cell }: { cell: Cell }) {
  switch (cell.kind) {
    case "media":
      return (
        <td className={s.cellMain}>
          <div className={s.itemTitle}>
            <Skeleton
              width={cell.media === "thumb" ? 56 : 44}
              height={cell.media === "thumb" ? 56 : 44}
              shape={cell.media === "avatar" ? "circle" : undefined}
              style={cell.media === "thumb" ? { borderRadius: 14 } : undefined}
            />
            <div className={s.skeletonStack}>
              <Skeleton width="55%" height={15} />
              <Skeleton width="80%" height={12} />
            </div>
          </div>
        </td>
      );
    case "text":
      return (
        <td data-label={cell.label}>
          <div className={s.skeletonStack}>
            {Array.from({ length: cell.lines ?? 1 }, (_, line) => (
              <Skeleton key={line} width={line ? "70%" : (cell.width ?? 120)} />
            ))}
          </div>
        </td>
      );
    case "pill":
      return (
        <td data-label={cell.label}>
          <Skeleton width={72} height={24} shape="pill" />
        </td>
      );
    case "switch":
      return (
        <td data-label={cell.label}>
          <Skeleton width={42} height={24} shape="pill" />
        </td>
      );
    case "stars":
      return (
        <td data-label={cell.label}>
          <Skeleton width={84} height={15} />
        </td>
      );
    case "actions":
      return (
        <td className={s.cellActions}>
          <div className={s.actions}>
            <Skeleton width={40} height={40} shape="circle" />
            <Skeleton width={40} height={40} shape="circle" />
          </div>
        </td>
      );
  }
}

function headerFor(cell: Cell) {
  if (cell.kind === "media") return "Name";
  if (cell.kind === "actions") return <span className="sr-only">Actions</span>;
  return cell.label;
}

function ListSkeleton({
  label,
  cells,
  rows = 5,
  toolbar = false,
}: {
  label: string;
  cells: Cell[];
  rows?: number;
  toolbar?: boolean;
}) {
  return (
    <Loading label={label}>
      <HeaderSkeleton />
      {toolbar && (
        <div className={s.toolbar}>
          <Skeleton
            width="min(100%, 360px)"
            height={46}
            style={{ borderRadius: 12 }}
          />
          <Skeleton width={200} height={46} style={{ borderRadius: 12 }} />
        </div>
      )}
      <table className={s.table}>
        <thead>
          <tr>
            {cells.map((cell, index) => (
              <th key={index} scope="col">
                {headerFor(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {cells.map((cell, index) => (
                <CellSkeleton key={index} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Loading>
  );
}

export const ProductsSkeleton = () => (
  <ListSkeleton
    label="products"
    toolbar
    rows={6}
    cells={[
      { kind: "media", media: "thumb" },
      { kind: "pill", label: "Category" },
      { kind: "text", label: "Price", width: 60 },
      { kind: "switch", label: "On menu" },
      { kind: "switch", label: "Featured" },
      { kind: "actions" },
    ]}
  />
);

export const CategoriesSkeleton = () => (
  <ListSkeleton
    label="categories"
    cells={[
      { kind: "media", media: "icon" },
      { kind: "text", label: "Products", width: 40 },
      { kind: "text", label: "Order", width: 30 },
      { kind: "switch", label: "Visible" },
      { kind: "actions" },
    ]}
  />
);

export const LocationsSkeleton = () => (
  <ListSkeleton
    label="locations"
    rows={3}
    cells={[
      { kind: "media", media: "thumb" },
      { kind: "text", label: "Address", width: 160 },
      { kind: "text", label: "Hours", width: 120, lines: 2 },
      { kind: "switch", label: "Visible" },
      { kind: "actions" },
    ]}
  />
);

export const SocialLinksSkeleton = () => (
  <ListSkeleton
    label="social links"
    rows={4}
    cells={[
      { kind: "media", media: "avatar" },
      { kind: "text", label: "Link", width: 200 },
      { kind: "switch", label: "Visible" },
      { kind: "actions" },
    ]}
  />
);

export const ContactsSkeleton = () => (
  <ListSkeleton
    label="contact details"
    rows={3}
    cells={[
      { kind: "media", media: "avatar" },
      { kind: "text", label: "Shown as", width: 170 },
      { kind: "switch", label: "Visible" },
      { kind: "actions" },
    ]}
  />
);

export const ReviewsSkeleton = () => (
  <ListSkeleton
    label="reviews"
    toolbar
    cells={[
      { kind: "media", media: "avatar" },
      { kind: "stars", label: "Rating" },
      { kind: "text", label: "Review", width: 240, lines: 2 },
      { kind: "switch", label: "Published" },
      { kind: "actions" },
    ]}
  />
);

export const TeamSkeleton = () => (
  <ListSkeleton
    label="team"
    rows={3}
    cells={[
      { kind: "media", media: "avatar" },
      { kind: "pill", label: "Role" },
      { kind: "text", label: "Joined", width: 90 },
      { kind: "actions" },
    ]}
  />
);

export function OverviewSkeleton() {
  return (
    <Loading label="overview">
      <HeaderSkeleton />
      <div className={s.stats}>
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className={`${s.card} ${s.stat}`}>
            <div className={s.statTop}>
              <Skeleton width={80} />
              <Skeleton width={38} height={38} style={{ borderRadius: 12 }} />
            </div>
            <Skeleton width={56} height={40} />
            <Skeleton width="70%" height={12} />
          </div>
        ))}
      </div>
      <div className={s.overviewGrid}>
        {[5, 4].map((lines, index) => (
          <div key={index} className={`${s.card} ${s.panel}`}>
            <Skeleton width={180} height={26} />
            {Array.from({ length: lines }, (_, line) => (
              <div key={line} style={{ display: "flex", gap: 12 }}>
                <Skeleton width={18} height={18} shape="circle" />
                <Skeleton width={`${85 - line * 9}%`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Loading>
  );
}

type FormSection = {
  fields: number;
  wide?: number;
  image?: boolean;
  choices?: number;
  stars?: boolean;
  /** The weekly opening-hours editor. */
  days?: boolean;
  toggles?: number;
};

function FormSkeleton({
  label,
  sections,
}: {
  label: string;
  sections: FormSection[];
}) {
  return (
    <Loading label={label}>
      <HeaderSkeleton back action={false} />
      <div className={s.form}>
        {sections.map((section, index) => (
          <div key={index} className={`${s.card} ${s.formSection}`}>
            <div className={s.skeletonStack}>
              <Skeleton width={180} height={24} />
              <Skeleton width="min(360px, 80%)" height={12} />
            </div>
            {section.image && (
              <div className={s.imageField}>
                <Skeleton
                  width={120}
                  height={120}
                  style={{ borderRadius: 18 }}
                />
                <div className={s.skeletonStack}>
                  <Skeleton width={190} height={40} shape="pill" />
                  <Skeleton width={220} height={12} />
                </div>
              </div>
            )}
            {section.days && (
              <div className={s.skeletonStack}>
                <Skeleton width={260} height={24} shape="pill" />
                {Array.from({ length: 7 }, (_, day) => (
                  <div
                    key={day}
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <Skeleton width={90} />
                    <Skeleton width={42} height={24} shape="pill" />
                    <Skeleton height={42} style={{ borderRadius: 12 }} />
                    <Skeleton height={42} style={{ borderRadius: 12 }} />
                  </div>
                ))}
              </div>
            )}
            {section.stars && (
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: 5 }, (_, star) => (
                  <Skeleton
                    key={star}
                    width={46}
                    height={46}
                    style={{ borderRadius: 12 }}
                  />
                ))}
              </div>
            )}
            {section.choices && (
              <div className={s.iconChoices}>
                {Array.from({ length: section.choices }, (_, choice) => (
                  <Skeleton
                    key={choice}
                    height={70}
                    style={{ borderRadius: 12 }}
                  />
                ))}
              </div>
            )}
            {section.fields > 0 && (
              <div className={s.fields}>
                {Array.from({ length: section.fields }, (_, field) => (
                  <div
                    key={field}
                    className={`${s.field} ${field < (section.wide ?? 0) ? s.fieldWide : ""}`}
                  >
                    <Skeleton width={110} height={13} />
                    <Skeleton height={46} style={{ borderRadius: 12 }} />
                  </div>
                ))}
              </div>
            )}
            {Array.from({ length: section.toggles ?? 0 }, (_, toggle) => (
              <div key={toggle} style={{ display: "flex", gap: 14 }}>
                <Skeleton width={42} height={24} shape="pill" />
                <div className={s.skeletonStack}>
                  <Skeleton width={140} />
                  <Skeleton width="60%" height={12} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Loading>
  );
}

export const ProductFormSkeleton = () => (
  <FormSkeleton
    label="product"
    sections={[
      { fields: 4, wide: 0, image: true },
      { fields: 4, wide: 1 },
      { fields: 0, toggles: 2 },
    ]}
  />
);

export const CategoryFormSkeleton = () => (
  <FormSkeleton
    label="category"
    sections={[{ fields: 3, wide: 1, choices: 9, toggles: 1 }]}
  />
);

export const LocationFormSkeleton = () => (
  <FormSkeleton
    label="location"
    sections={[
      { fields: 4, image: true },
      { fields: 1, wide: 1, days: true },
      { fields: 3, wide: 1, toggles: 1 },
    ]}
  />
);

export const PromotionsSkeleton = () => (
  <ListSkeleton
    label="promotions"
    toolbar
    cells={[
      { kind: "media", media: "avatar" },
      { kind: "pill", label: "Offer" },
      { kind: "text", label: "Dates", width: 110 },
      { kind: "pill", label: "Status" },
      { kind: "switch", label: "Active" },
      { kind: "actions" },
    ]}
  />
);

export const PromotionFormSkeleton = () => (
  <FormSkeleton
    label="promotion"
    sections={[
      { fields: 3, wide: 3 },
      { fields: 2 },
      { fields: 2, toggles: 1 },
    ]}
  />
);

export const SocialLinkFormSkeleton = () => (
  <FormSkeleton
    label="social link"
    sections={[{ fields: 4, wide: 1, toggles: 1 }]}
  />
);

export const ContactFormSkeleton = () => (
  <FormSkeleton label="contact" sections={[{ fields: 4, toggles: 1 }]} />
);

export const ReviewFormSkeleton = () => (
  <FormSkeleton
    label="review"
    sections={[{ fields: 4, wide: 1, stars: true, toggles: 1 }]}
  />
);
