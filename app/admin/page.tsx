import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  ChevronRight,
  CircleCheck,
  CircleDot,
  Coffee,
  ExternalLink,
  MapPinned,
  MessageSquareQuote,
  Phone,
  Plus,
  Share2,
  Tags,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/Page";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { cafeToday, promotionStatus } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";

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
  ]);
  // Promotions arrive with their own migration; until then there are none.
  const promotions =
    promotionResult.error?.code === "PGRST205" ? null : rows(promotionResult);
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
      sub: `${published.length} published`,
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
    <div className={s.page}>
      <PageHeader
        eyebrow="Overview"
        title={firstName ? `Hello, ${firstName}` : "Hello"}
        description="Everything visitors see on the homepage is managed here. Changes go live as soon as you save."
        actions={
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className={s.buttonSecondary}
          >
            <ExternalLink size={16} aria-hidden="true" /> View website
          </a>
        }
      />
      <div className={s.stats}>
        {stats.map(({ href, label, icon: Icon, value, sub }) => (
          <Link key={href} href={href} className={`${s.card} ${s.stat}`}>
            <span className={s.statTop}>
              {label}
              <Icon aria-hidden="true" />
            </span>
            <span className={s.statValue}>{value}</span>
            <span className={s.statSub}>{sub}</span>
          </Link>
        ))}
      </div>
      <div className={s.overviewGrid}>
        <section
          className={`${s.card} ${s.panel}`}
          aria-labelledby="health-title"
        >
          <h2 id="health-title">Homepage health</h2>
          <ul className={s.checklist}>
            {checks.map((check, index) => (
              <li key={index}>
                {check.ok ? (
                  <CircleCheck
                    size={18}
                    className={s.checkOk}
                    aria-label="Done"
                  />
                ) : (
                  <CircleDot
                    size={18}
                    className={s.checkTodo}
                    aria-label="To do"
                  />
                )}
                <span>{check.text}</span>
              </li>
            ))}
          </ul>
        </section>
        <section
          className={`${s.card} ${s.panel}`}
          aria-labelledby="quick-title"
        >
          <h2 id="quick-title">Quick actions</h2>
          <div className={s.quickActions}>
            {[
              {
                href: "/admin/products/new",
                label: "Add a product",
                icon: Coffee,
              },
              {
                href: "/admin/promotions/new",
                label: "Create a promotion",
                icon: BadgePercent,
              },
              {
                href: "/admin/reviews/new",
                label: "Add a review",
                icon: MessageSquareQuote,
              },
              {
                href: "/admin/locations/new",
                label: "Add a location",
                icon: MapPinned,
              },
              {
                href: "/admin/team",
                label: "Manage admin access",
                icon: Users,
              },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                {href.endsWith("/new") ? (
                  <Plus size={18} aria-hidden="true" />
                ) : (
                  <Icon size={18} aria-hidden="true" />
                )}
                {label}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
