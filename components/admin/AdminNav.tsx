"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  BadgePercent,
  Coffee,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquareQuote,
  Phone,
  Share2,
  Tags,
  Users,
  X,
} from "lucide-react";
import { assets } from "@/data/brand";
import { signOut } from "@/app/login/actions";
import { containDialogFocus } from "@/lib/dialog";
import s from "./admin.module.css";

const groups = [
  {
    label: "MENU",
    links: [
      { href: "/admin/products", label: "Products", icon: Coffee },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/promotions", label: "Promotions", icon: BadgePercent },
    ],
  },
  {
    label: "CAFÉ",
    links: [
      { href: "/admin/locations", label: "Locations", icon: MapPinned },
      { href: "/admin/social-links", label: "Social links", icon: Share2 },
      { href: "/admin/contacts", label: "Contact", icon: Phone },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
    ],
  },
  {
    label: "ACCESS",
    links: [{ href: "/admin/team", label: "Team & roles", icon: Users }],
  },
];

type Viewer = { email: string | null; fullName: string | null };

function Brand() {
  return (
    <Link href="/admin" className={s.brand}>
      <Image src={assets.mark} alt="" width={34} height={34} />
      <span>
        Caffeine
        <small>DASHBOARD</small>
      </span>
    </Link>
  );
}

function NavContent({
  viewer,
  onNavigate,
}: {
  viewer: Viewer;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  const linkClass = (href: string) =>
    `${s.navLink} ${isActive(href) ? s.navLinkActive : ""}`;
  const name = viewer.fullName || viewer.email || "Admin";

  return (
    <>
      <nav className={s.nav} aria-label="Dashboard">
        <Link
          href="/admin"
          className={linkClass("/admin")}
          aria-current={isActive("/admin") ? "page" : undefined}
          onClick={onNavigate}
        >
          <LayoutDashboard size={18} /> Overview
        </Link>
        {groups.map((group) => (
          <div key={group.label} className={s.nav}>
            <p className={s.navLabel}>{group.label}</p>
            {group.links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={linkClass(href)}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className={s.navFooter}>
        <a href="/" target="_blank" rel="noopener" className={s.navLink}>
          <ExternalLink size={18} /> View website
        </a>
        <div className={s.viewer}>
          <span className={s.avatar} aria-hidden="true">
            {name.charAt(0)}
          </span>
          <div>
            <strong>{name}</strong>
            <span>Admin</span>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className={`${s.navLink} ${s.signOut}`}>
            <LogOut size={18} /> Sign out
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminNav({ viewer }: { viewer: Viewer }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <header className={s.topbar}>
        <Brand />
        <button
          type="button"
          className={s.menuButton}
          aria-label="Open dashboard menu"
          aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}
        >
          <Menu size={22} />
        </button>
      </header>
      <dialog
        ref={dialog}
        className={s.navDialog}
        aria-label="Dashboard menu"
        onKeyDown={containDialogFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={s.navPanel}>
          <div className={s.navPanelTop}>
            <Brand />
            <button
              type="button"
              className={s.menuButton}
              aria-label="Close dashboard menu"
              onClick={close}
              autoFocus
            >
              <X size={22} />
            </button>
          </div>
          <NavContent viewer={viewer} onNavigate={close} />
        </div>
      </dialog>
      <aside className={s.sidebar}>
        <div className={s.navPanel}>
          <Brand />
          <NavContent viewer={viewer} />
        </div>
      </aside>
    </>
  );
}
