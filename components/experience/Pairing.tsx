import { ArrowUpRight } from "lucide-react";
import type { MenuProduct, SiteOffer } from "@/lib/content";
import type { CategoryIcon } from "@/lib/site";
import { PairingLazy } from "./PairingLazy";
import s from "./pairing.module.css";

const drinkIcons = new Set<CategoryIcon>(["coffee", "iced", "tea", "juice"]);
const biteIcons = new Set<CategoryIcon>([
  "sweet",
  "cake",
  "pastry",
  "food",
  "dessert",
]);

/** Priced products for one reel, photographed ones first when there are enough. */
function reel(products: MenuProduct[], icons: Set<CategoryIcon>) {
  const list = products.filter(
    (product) => icons.has(product.categoryIcon) && product.price !== null,
  );
  const pictured = list.filter((product) => product.image);
  return (pictured.length >= 3 ? pictured : list).slice(0, 12);
}

/** "Some things just belong together": a slot machine for coffee dates. */
export function Pairing({
  products,
  offers,
}: {
  products: MenuProduct[];
  offers: SiteOffer[];
}) {
  const drinks = reel(products, drinkIcons);
  const bites = reel(products, biteIcons);
  const drinkIds = new Set(drinks.map((product) => product.id));
  const biteIds = new Set(bites.map((product) => product.id));
  // Bundles of exactly one drink and one bite from the reels.
  const bundles = offers
    .filter(
      (offer) =>
        offer.bundle &&
        offer.items.length === 2 &&
        offer.items.some(({ product }) => drinkIds.has(product.id)) &&
        offer.items.some(({ product }) => biteIds.has(product.id)),
    )
    .map((offer) => ({
      title: offer.title,
      price: offer.offer,
      regular: offer.regular,
      ids: offer.items.map(({ product }) => product.id),
    }));
  const ready = drinks.length > 0 && bites.length > 0;

  return (
    <section id="pairing" className={s.pairing} aria-labelledby="pairing-title">
      <span className={s.amp} aria-hidden="true">
        &amp;
      </span>
      <div className={s.inner}>
        <div className={s.copy} data-reveal>
          <p className={s.eyebrow}>SOME THINGS JUST BELONG TOGETHER</p>
          <h2 id="pairing-title">
            Meet your
            <br />
            <em>perfect match.</em>
          </h2>
          <p className={s.lede}>
            A cold sip. A warm bite. Pull the lever and let the café pick your
            next coffee date.
          </p>
          {bundles.length > 0 && (
            <p className={s.hint}>Some matches come with a bundle price.</p>
          )}
          {!ready && (
            <a className={s.menuLink} href="#menu">
              Explore the menu <ArrowUpRight size={18} />
            </a>
          )}
        </div>
        {ready && <PairingLazy drinks={drinks} bites={bites} bundles={bundles} />}
      </div>
    </section>
  );
}
