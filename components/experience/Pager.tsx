"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import s from "./pager.module.css";

/** Page numbers to show: all when few, else the ends and the current area. */
export function pageRange(count: number, current: number) {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index);
  const pages = new Set([0, count - 1, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 0 && page < count)
    .sort((a, b) => a - b);
  const entries: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) entries.push("gap");
    entries.push(page);
  });
  return entries;
}

/**
 * Previous, numbered and next page buttons. Sections theme it through
 * --pager-* custom properties.
 */
export function Pager({
  label,
  count,
  page,
  onPage,
  className = "",
}: {
  /** Names the navigation, e.g. "Coffee pages". */
  label: string;
  count: number;
  page: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (count < 2) return null;
  return (
    <nav className={`${s.pager} ${className}`} aria-label={label}>
      <button
        type="button"
        className={s.arrow}
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
      >
        <ArrowLeft size={18} strokeWidth={1.7} />
      </button>
      <ol className={s.pages}>
        {pageRange(count, page).map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} className={s.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                onClick={() => onPage(entry)}
                aria-label={`Page ${entry + 1}`}
                aria-current={entry === page ? "page" : undefined}
              >
                {entry + 1}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        type="button"
        className={s.arrow}
        onClick={() => onPage(page + 1)}
        disabled={page === count - 1}
        aria-label="Next page"
      >
        <ArrowRight size={18} strokeWidth={1.7} />
      </button>
    </nav>
  );
}
