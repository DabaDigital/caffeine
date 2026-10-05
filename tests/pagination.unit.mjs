import assert from "node:assert/strict";
import { test } from "node:test";
import { paginate } from "../lib/pagination.ts";

const items = Array.from({ length: 31 }, (_, id) => id);

test("every row is reachable exactly once across pages", () => {
  const pages = Array.from({ length: 4 }, (_, index) =>
    paginate(items, String(index + 1)),
  );
  assert.deepEqual(
    pages.flatMap((page) => page.items),
    items,
  );
  assert.deepEqual(
    pages.map(({ start, end }) => [start, end]),
    [
      [1, 10],
      [11, 20],
      [21, 30],
      [31, 31],
    ],
  );
});
test("invalid pages safely fall back and stale pages clamp", () => {
  for (const value of [
    undefined,
    "",
    "-1",
    "1.5",
    "NaN",
    "Infinity",
    ["2", "3"],
  ]) {
    assert.equal(paginate(items, value).page, 1);
  }
  assert.equal(paginate(items, "999").page, 4);
  assert.equal(paginate(items.slice(0, 30), "4").page, 3);
});
test("empty and filtered lists report correct boundaries", () => {
  assert.deepEqual(paginate([], "9"), {
    page: 1,
    pages: 1,
    total: 0,
    start: 0,
    end: 0,
    items: [],
  });
  const result = paginate(
    items.filter((id) => id < 3),
    "4",
  );
  assert.equal(result.page, 1);
  assert.equal(result.total, 3);
  assert.deepEqual(result.items, [0, 1, 2]);
});
