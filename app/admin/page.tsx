import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  Coffee,
  MapPinned,
  MessageSquareQuote,
  Phone,
  Share2,
  Tags,
  Users,
} from "lucide-react";
import { Overview } from "@/components/admin/Overview";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { cafeToday, promotionStatus } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

type Check = { ok: boolean; text: React.ReactNode };

export default async function OverviewPage() {
  const viewer = await requireAdmin();
  const supabase = await createClient();
  const [
    products,
    categories,
    locations,
    socials,
    contacts,
    reviews,
    team,
    promotionResult,
    waitingResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, is_available, is_featured, image_url")
      .then(rows),
    supabase.from("categories").select("id, is_active").then(rows),
    supabase
      .from("locations")
      .select("id, name, is_active, address, hours")
      .order("sort_order")
      .then(rows),
    supabase.from("social_links").select("id, is_active").then(rows),
    supabase.from("contacts").select("id, is_active").then(rows),
    supabase.from("reviews").select("id, is_published").then(rows),
    supabase.from("profiles").select("id, role").then(rows),
    supabase.from("promotions").select("id, is_active, starts_on, ends_on"),
    supabase.from("reviews").select("id").eq("status", "pending"),
  ]);
  // Promotions arrive with their own migration; until then there are none.
  const promotions =
    promotionResult.error?.code === "PGRST205" ? null : rows(promotionResult);
  // So do guests' reviews (42703: the status column is missing).
  const waiting =
    waitingResult.error?.code === "42703" ? 0 : rows(waitingResult).length;
  const today = cafeToday();
  const running = (promotions ?? []).filter(
    (promotion) => promotionStatus(promotion, today) === "running",
  );

  const onMenu = products.filter((product) => product.is_available);
  const featured = onMenu.filter((product) => product.is_featured);
  const withoutPhoto = onMenu.filter((product) => !product.image_url);
  const visibleLocations = locations.filter((location) => location.is_active);
  const primary = visibleLocations[0];
  const published = reviews.filter((review) => review.is_published);
  const activeContacts = contacts.filter((contact) => contact.is_active);
  const activeSocials = socials.filter((link) => link.is_active);

  const stats = [
    {
      href: "/admin/products",
      label: "Products",
      icon: Coffee,
      value: products.length,
      sub: `${onMenu.length} on the menu · ${featured.length} featured`,
    },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: Tags,
      value: categories.length,
      sub: `${categories.filter((c) => c.is_active).length} visible`,
    },
    {
      href: "/admin/promotions",
      label: "Promotions",
      icon: BadgePercent,
      value: promotions?.length ?? 0,
      sub: promotions
        ? `${running.length} running now`
        : "Needs a database update",
    },
    {
      href: "/admin/locations",
      label: "Locations",
      icon: MapPinned,
      value: locations.length,
      sub: `${visibleLocations.length} shown on the site`,
    },
    {
      href: "/admin/social-links",
      label: "Social links",
      icon: Share2,
      value: socials.length,
      sub: `${activeSocials.length} visible`,
    },
    {
      href: "/admin/contacts",
      label: "Contact",
      icon: Phone,
      value: contacts.length,
      sub: `${activeContacts.length} visible`,
    },
    {
      href: "/admin/reviews",
      label: "Reviews",
      icon: MessageSquareQuote,
      value: reviews.length,
      sub: `${published.length} published${waiting ? ` · ${waiting} waiting` : ""}`,
    },
    {
      href: "/admin/team",
      label: "Team",
      icon: Users,
      value: team.length,
      sub: `${team.filter((member) => member.role === "admin").length} with admin access`,
    },
  ];

  const checks: Check[] = [
    onMenu.length
      ? { ok: true, text: `${onMenu.length} products are on the menu.` }
      : {
          ok: false,
          text: (
            <>
              No products are on the menu yet.{" "}
              <Link href="/admin/products/new">Add your first product</Link>
            </>
          ),
        },
    featured.length
      ? {
          ok: true,
          text: `${featured.length} featured products fill the homepage carousel.`,
        }
      : {
          ok: false,
          text: (
            <>
              Nothing is featured, so the carousel shows your first products.{" "}
              <Link href="/admin/products">Feature your favorites</Link>
            </>
          ),
        },
    ...(withoutPhoto.length
      ? [
          {
            ok: false,
            text: (
              <>
                {withoutPhoto.length} menu{" "}
                {withoutPhoto.length === 1 ? "item has" : "items have"} no photo
                and show an icon instead.
              </>
            ),
          },
        ]
      : []),
    primary
      ? primary.address && primary.hours
        ? { ok: true, text: `${primary.name} shows its address and hours.` }
        : {
            ok: false,
            text: (
              <>
                Add the street address and opening hours for {primary.name}.{" "}
                <Link href={`/admin/locations/${primary.id}`}>
                  Edit location
                </Link>
              </>
            ),
          }
      : {
          ok: false,
          text: (
            <>
              Visitors can’t see where you are yet.{" "}
              <Link href="/admin/locations/new">Add a location</Link>
            </>
          ),
        },
    activeContacts.length
      ? { ok: true, text: "Guests can reach you from the footer." }
      : {
          ok: false,
          text: (
            <>
              No phone number or email is shown.{" "}
              <Link href="/admin/contacts/new">Add contact details</Link>
            </>
          ),
        },
    published.length
      ? {
          ok: true,
          text: `${published.length} published reviews appear on the homepage.`,
        }
      : {
          ok: false,
          text: (
            <>
              No reviews are published, so the homepage invites guests to share
              feedback. <Link href="/admin/reviews/new">Add a review</Link>
            </>
          ),
        },
  ];

  const firstName = (viewer.fullName || viewer.email || "").split(/[ @]/)[0];

  return (
    <Overview
      firstName={firstName}
      stats={stats}
      checks={checks}
      waiting={waiting}
    />
  );
}
