import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s from "./admin.module.css";

type PaginationState = {
  page: number;
  pages: number;
  total: number;
  start: number;
  end: number;
};
export function Pagination({
  pagination,
  pathname,
  searchParams,
}: {
  pagination: PaginationState;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { page, pages, total, start, end } = pagination;
  if (!total) return null;
  function href(target: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (["page", "notice", "n"].includes(key) || value === undefined)
        continue;
      for (const entry of Array.isArray(value) ? value : [value])
        query.append(key, entry);
    }
    if (target > 1) query.set("page", String(target));
    return query.size ? `${pathname}?${query}` : pathname;
  }
  const numbers = Array.from(new Set([1, page - 1, page, page + 1, pages]))
    .filter((value) => value >= 1 && value <= pages)
    .sort((a, b) => a - b);
  return (
    <nav className={s.pagination} aria-label="Table pagination">
      <p>
        Showing{" "}
        <strong>
          {start}–{end}
        </strong>{" "}
        of <strong>{total}</strong>
      </p>
      <div className={s.paginationPages}>
        {page > 1 ? (
          <Link href={href(page - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </Link>
        ) : (
          <span aria-disabled="true" aria-label="Previous page">
            <ChevronLeft size={16} />
          </span>
        )}
        {numbers.map((value, index) => (
          <span key={value} className={s.paginationSlot}>
            {index > 0 && value - numbers[index - 1] > 1 && (
              <span className={s.paginationGap} aria-hidden="true">
                …
              </span>
            )}
            <Link
              href={href(value)}
              aria-label={`Page ${value}`}
              aria-current={page === value ? "page" : undefined}
            >
              {value}
            </Link>
          </span>
        ))}
        {page < pages ? (
          <Link href={href(page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span aria-disabled="true" aria-label="Next page">
            <ChevronRight size={16} />
          </span>
        )}
      </div>
    </nav>
  );
}
