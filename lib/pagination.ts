export const PAGE_SIZE = 10;

/** Clamp malformed or stale URLs, including the last page after a deletion. */
export function paginate<T>(
  items: readonly T[],
  requested?: string | string[],
) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const parsed =
    typeof requested === "string" && /^\d+$/.test(requested)
      ? Number(requested)
      : 1;
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(parsed) ? parsed : 1),
  );
  const offset = (page - 1) * PAGE_SIZE;
  return {
    page,
    pages,
    total: items.length,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + PAGE_SIZE, items.length),
    items: items.slice(offset, offset + PAGE_SIZE),
  };
}
