import type { MenuCategory, MenuProduct } from "@/lib/content";
import { Bulbs } from "./Bulbs";
import { MenuBrowser } from "./MenuBrowser";
import s from "./menu-browser.module.css";

/** The café wall: OSB board, Edison bulbs and the menu screen. */
export function MenuSection({
  number,
  products,
  categories,
}: {
  number: string;
  products: MenuProduct[];
  categories: MenuCategory[];
}) {
  return (
    <section id="menu" className={s.wall} aria-labelledby="menu-title">
      <Bulbs />
      <div className={s.inner}>
        <header className={s.heading} data-reveal>
          <div>
            <p className={s.eyebrow}>{number} — FOLLOW YOUR CRAVING</p>
            <h2 id="menu-title">
              A whole lot to <em>love.</em>
            </h2>
          </div>
          <p>
            Something bold. Something chilled.
            <br />
            Something “just one more bite.”
          </p>
        </header>
        <MenuBrowser products={products} categories={categories} />
      </div>
    </section>
  );
}
