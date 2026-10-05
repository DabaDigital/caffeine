import Link from "next/link";
import {
  ArrowUpRight,
  BadgePercent,
  Check,
  ChevronRight,
  CircleDot,
  Coffee,
  ExternalLink,
  MessageSquareQuote,
  Plus,
  type LucideIcon,
} from "lucide-react";
import s from "./overview.module.css";

export type OverviewStat = {
  href: string;
  label: string;
  icon: LucideIcon;
  value: number;
  sub: string;
};
export type OverviewCheck = { ok: boolean; text: React.ReactNode };

export function Overview({
  firstName,
  stats,
  checks,
  waiting,
}: {
  firstName: string;
  stats: OverviewStat[];
  checks: OverviewCheck[];
  waiting: number;
}) {
  const complete = checks.filter((check) => check.ok).length;
  const needsAttention = checks.length - complete;
  return (
    <div className={s.overview}>
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>Your café, at a glance</span>
          <h1>
            {firstName ? `Hello, ${firstName}` : "Hello"}
            <span>.</span>
          </h1>
          <p>A good day starts behind the counter.</p>
        </div>
        <a href="/" target="_blank" rel="noopener" className={s.website}>
          View website{" "}
          <span>
            <ExternalLink size={15} aria-hidden="true" />
          </span>
        </a>
      </header>

      {waiting > 0 && (
        <Link href="/admin/reviews" className={s.inbox}>
          <MessageSquareQuote size={19} aria-hidden="true" />
          <span>
            <strong>
              {waiting} {waiting === 1 ? "review needs" : "reviews need"} your
              attention
            </strong>
            <small>Read what your guests are saying.</small>
          </span>
          <span className={s.reviewLink}>
            Review now <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>
      )}

      <div className={s.workspace}>
        <section
          className={`${s.surface} ${s.menuSurface}`}
          aria-labelledby="menu-title"
        >
          <div className={s.menu}>
            <div className={s.panelHeading}>
              <span className={s.kicker}>
                <Coffee size={18} aria-hidden="true" /> The menu
              </span>
              <Link
                href="/admin/products"
                className={s.roundLink}
                aria-label="Manage products"
              >
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            </div>
            <div className={s.menuBody}>
              <div>
                <h2 id="menu-title">Made for your guests.</h2>
                <p>Keep every sip and sweet moment up to date.</p>
              </div>
              <Link href="/admin/products" className={s.productCount}>
                <strong>{stats[0].value}</strong>
                <span>products</span>
              </Link>
            </div>
            <div className={s.menuFooter}>
              <span>{stats[0].sub}</span>
              <Link href="/admin/products">
                Manage menu <ChevronRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={s.metrics}>
            {stats
              .slice(1, 3)
              .map(({ href, label, icon: Icon, value, sub }) => (
                <Link href={href} key={href} className={s.metric}>
                  <span className={s.metricIcon}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className={s.metricText}>
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </span>
                  <b>{value}</b>
                  <ChevronRight size={15} aria-hidden="true" />
                </Link>
              ))}
          </div>
        </section>

        <section className={s.surface} aria-labelledby="quick-title">
          <div className={s.panel}>
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>A little upkeep</span>
                <h2 id="quick-title">Quick actions</h2>
              </div>
              <span className={s.headingIcon}>
                <Plus size={21} aria-hidden="true" />
              </span>
            </div>
            <div className={s.quickActions}>
              {[
                {
                  href: "/admin/products/new",
                  label: "Add a product",
                  detail: "Something new on the menu",
                  icon: Coffee,
                },
                {
                  href: "/admin/promotions/new",
                  label: "Create a promotion",
                  detail: "Give guests a reason to stop by",
                  icon: BadgePercent,
                },
                {
                  href: "/admin/reviews/new",
                  label: "Add a review",
                  detail: "Share a guest’s experience",
                  icon: MessageSquareQuote,
                },
              ].map(({ href, label, detail, icon: Icon }) => (
                <Link key={href} href={href}>
                  <span className={s.actionIcon}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={s.surface} aria-labelledby="health-title">
          <div className={s.panel}>
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>Ready for visitors</span>
                <h2 id="health-title">Homepage health</h2>
              </div>
              <span
                className={`${s.healthBadge} ${needsAttention ? s.attention : ""}`}
              >
                {needsAttention ? `${needsAttention} to check` : "All set"}
              </span>
            </div>
            <div className={s.healthSummary}>
              <span>
                {complete} of {checks.length} checks complete
              </span>
              <div className={s.segments} aria-hidden="true">
                {checks.map((check, index) => (
                  <span key={index} data-complete={check.ok} />
                ))}
              </div>
            </div>
            <ul className={s.checklist}>
              {checks.map((check, index) => (
                <li key={index}>
                  <span className={check.ok ? s.checkDone : s.checkTodo}>
                    {check.ok ? (
                      <Check size={13} aria-label="Done" />
                    ) : (
                      <CircleDot size={15} aria-label="To do" />
                    )}
                  </span>
                  <span>{check.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.surface} aria-labelledby="cafe-title">
          <div className={s.panel}>
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>The details matter</span>
                <h2 id="cafe-title">Your café</h2>
              </div>
            </div>
            <nav className={s.management} aria-label="Café management">
              {stats.slice(3).map(({ href, label, icon: Icon, value, sub }) => (
                <Link key={href} href={href}>
                  <Icon size={17} aria-hidden="true" />
                  <span>
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </span>
                  <b>{value}</b>
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              ))}
            </nav>
            <Link href="/admin/locations/new" className={s.addLocation}>
              <Plus size={14} aria-hidden="true" /> Add a location
            </Link>
          </div>
        </section>
      </div>
      <footer className={s.footer}>
        <span>Caffeine · Behind the counter</span>
        <span>Saved changes appear on your website.</span>
      </footer>
    </div>
  );
}
