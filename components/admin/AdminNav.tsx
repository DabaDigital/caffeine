"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  BadgePercent,
  PanelLeftClose,
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
    <Link
      href="/admin"
      className={s.brand}
      aria-label="Caffeine dashboard"
      title="Caffeine dashboard"
    >
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
  collapsed = false,
}: {
  viewer: Viewer;
  onNavigate?: () => void;
  collapsed?: boolean;
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
          aria-label="Overview"
          title={collapsed ? "Overview" : undefined}
          className={linkClass("/admin")}
          aria-current={isActive("/admin") ? "page" : undefined}
          onClick={onNavigate}
        >
          <LayoutDashboard size={18} />
          <span className={s.navText}>Overview</span>
        </Link>
        {groups.map((group) => (
          <div key={group.label} className={s.nav}>
            <p className={s.navLabel}>{group.label}</p>
            {group.links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={collapsed ? label : undefined}
                className={linkClass(href)}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon size={18} />
                <span className={s.navText}>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className={s.navFooter}>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className={s.navLink}
          aria-label="View website"
          title={collapsed ? "View website" : undefined}
        >
          <ExternalLink size={18} />
          <span className={s.navText}>View website</span>
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
          <button
            type="submit"
            className={`${s.navLink} ${s.signOut}`}
            aria-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut size={18} />
            <span className={s.navText}>Sign out</span>
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminNav({ viewer }: { viewer: Viewer }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [collapsed, setCollapsed] = useState(false);
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
      <aside className={s.sidebar} data-collapsed={collapsed}>
        <div className={s.navPanel}>
          <Brand />
          <button
            type="button"
            className={s.sidebarToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="desktop-dashboard-navigation"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelLeftClose size={19} aria-hidden="true" />
            <span className={s.navText}>Collapse sidebar</span>
          </button>
          <div
            id="desktop-dashboard-navigation"
            className={s.desktopNavContent}
          >
            <NavContent viewer={viewer} collapsed={collapsed} />
          </div>
        </div>
      </aside>
    </>
  );
}
