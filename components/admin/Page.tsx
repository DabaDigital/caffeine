import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import s from "./admin.module.css";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <>
      {back && (
        <Link href={back.href} className={s.backLink}>
          <ChevronLeft size={16} /> {back.label}
        </Link>
      )}
      <header className={s.pageHeader}>
        <div>
          {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className={s.headerActions}>{actions}</div>}
      </header>
    </>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${s.card} ${s.empty}`}>
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Hint({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <p className={s.hint}>
      <Icon size={16} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function DangerZone({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={s.dangerZone} aria-label={title}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function AddLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={s.button}>
      {children}
    </Link>
  );
}
