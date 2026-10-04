"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Coffee,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { Product } from "@/data/menu";
import { assets } from "@/data/brand";
import { categoryIconComponents } from "@/components/icons";
import type { MenuProduct } from "@/lib/content";
import {
  currency,
  formatPrice,
  shortDate,
  type CategoryIcon,
} from "@/lib/site";
import { containDialogFocus } from "@/lib/dialog";

/** The fields the menu dialog needs; dashboard products provide all of them. */
export type DialogProduct = Pick<
  MenuProduct,
  "id" | "name" | "category" | "description" | "detail" | "price"
> & {
  image: string | null;
  badge?: string | null;
  offer?: MenuProduct["offer"];
  ingredients?: string[];
  categoryIcon?: CategoryIcon;
};

/** Where in-café orders are taken, from the first dashboard location. */
export type OrderLocation = { name: string; place: string; mapUrl: string };

type Mode = "menu" | "order" | "product";
const MenuContext = createContext<{
  openMenu: (mode?: Mode, product?: DialogProduct) => void;
} | null>(null);
export function useMenu() {
  const value = useContext(MenuContext);
  if (!value) throw new Error("Menu controls must be inside MenuProvider");
  return value;
}

export function MenuProvider({
  children,
  items,
  categories = [...new Set(items.map((item) => item.category))],
  location = null,
}: {
  children: ReactNode;
  items: DialogProduct[];
  categories?: string[];
  location?: OrderLocation | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>("menu");
  const [product, setProduct] = useState<DialogProduct | null>(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  // A product opened from this dialog's list goes back to it; one opened
  // from the page goes back to the page.
  const [fromList, setFromList] = useState(false);
  function openMenu(nextMode: Mode = "menu", nextProduct?: DialogProduct) {
    setMode(nextMode);
    setProduct(nextProduct ?? null);
    setFromList(false);
    setCategory("All");
    setQuery("");
    if (!dialog.current?.open) dialog.current?.showModal();
  }
  const filtered = items.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      `${item.name} ${item.description}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim()),
  );
  return (
    <MenuContext.Provider value={{ openMenu }}>
      {children}
      <dialog
        ref={dialog}
        onKeyDown={containDialogFocus}
        className={`menu-dialog ${mode === "product" ? "detail-dialog" : ""}`}
        aria-labelledby="dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="dialog-body">
          <button
            autoFocus
            className="icon-button close-button"
            aria-label="Close menu"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} />
          </button>
          {mode === "order" ? (
            <div className="order-content">
              <Coffee size={40} strokeWidth={1.2} className="gold" />
              <p className="eyebrow">YOUR NEXT COFFEE BREAK</p>
              <h2 id="dialog-title">
                A table. A coffee.
                <br />
                <em>A sweet moment.</em>
              </h2>
              <p className="body-copy">
                Orders are taken in our café
                {location ? ` in ${location.place}` : ""}. Explore a few
                favorites, then join us for your next coffee break.
              </p>
              <div className="order-actions">
                {location && (
                  <a
                    className="button"
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={17} />
                    Find {location.name}
                    <ArrowUpRight size={16} />
                  </a>
                )}
                <button className="text-link" onClick={() => setMode("menu")}>
                  Explore our favorites
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          ) : mode === "product" && product ? (
            <div className="product-detail">
              <button
                className="text-link back-link"
                onClick={() =>
                  fromList ? setMode("menu") : dialog.current?.close()
                }
              >
                <ArrowLeft size={16} />
                {fromList ? "All favorites" : "Back to the menu"}
              </button>
              <div className={`detail-image detail-${product.id}`}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 767px) 85vw, 400px"
                  />
                ) : (
                  <ProductIcon icon={product.categoryIcon} size={56} />
                )}
              </div>
              <p className="eyebrow">
                {product.category}
                {product.badge ? ` · ${product.badge}` : ""}
              </p>
              <h2 id="dialog-title">{product.name}</h2>
              <p className="body-copy">{product.detail}</p>
              {product.ingredients && product.ingredients.length > 0 && (
                <ul className="detail-notes" aria-label="What’s in it">
                  {product.ingredients.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
              {product.price !== null && (
                <p className="detail-price">
                  <span>
                    {formatPrice(product.offer?.price ?? product.price)}{" "}
                    {currency}
                  </span>
                  {product.offer && (
                    <s>
                      <span className="sr-only">Regular price </span>
                      {formatPrice(product.price)} {currency}
                    </s>
                  )}
                </p>
              )}
              {product.offer && (
                <p className="detail-offer">
                  <span>{product.offer.label}</span>
                  Exclusive offer: {product.offer.title}
                  {product.offer.until &&
                    `, until ${shortDate(product.offer.until)}`}
                </p>
              )}
              <p className="detail-note">
                Ask our team for today’s selection, prices and allergen
                information.
              </p>
              <button className="button" onClick={() => setMode("order")}>
                Enjoy it in café
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <p className="eyebrow">A TASTE OF CAFFEINE</p>
              <h2 id="dialog-title">
                Find your <em>favorite.</em>
              </h2>
              <p className="body-copy">
                Coffee or something sweet? Start here.
              </p>
              <div className="menu-tools">
                <div
                  className="category-filters"
                  role="group"
                  aria-label="Filter by category"
                >
                  {["All", ...categories].map((item) => (
                    <button
                      key={item}
                      aria-pressed={category === item}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <label className="menu-search">
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Find your favorite"
                    aria-label="Search menu"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>
              <p className="sr-only" role="status">
                {filtered.length}{" "}
                {filtered.length === 1 ? "favorite" : "favorites"} found
              </p>
              <div className="dialog-products">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    className="dialog-product"
                    onClick={() => {
                      setProduct(item);
                      setFromList(true);
                      setMode("product");
                    }}
                  >
                    <div className="dialog-product-image">
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="110px" />
                      ) : (
                        <ProductIcon icon={item.categoryIcon} size={30} />
                      )}
                    </div>
                    <div>
                      <span className="dialog-product-category">
                        {item.category}
                        {item.offer && (
                          <span className="dialog-product-offer">
                            {item.offer.label}
                          </span>
                        )}
                      </span>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
              {items.length === 0 && (
                <div className="menu-empty">
                  <Coffee size={28} />
                  <h3>Our menu is being updated.</h3>
                  <p>Visit the café to discover today’s selection.</p>
                </div>
              )}
              {items.length > 0 && filtered.length === 0 && (
                <div className="menu-empty">
                  <Coffee size={28} />
                  <h3>No matching favorites.</h3>
                  <p>
                    Try another word
                    {categories[0]
                      ? ` like “${categories[0].toLocaleLowerCase()}”`
                      : ""}
                    , or explore everything.
                  </p>
                  <button
                    className="text-link"
                    onClick={() => {
                      setQuery("");
                      setCategory("All");
                    }}
                  >
                    Show all favorites
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              <p className="dialog-footnote">
                This is a taste of our menu. Visit the café for the full
                selection and current prices.
              </p>
            </>
          )}
        </div>
      </dialog>
    </MenuContext.Provider>
  );
}

/** Stands in for a product photo that hasn't been added yet. */
function ProductIcon({ icon, size }: { icon?: CategoryIcon; size: number }) {
  const Icon = icon ? categoryIconComponents[icon] : Coffee;
  return (
    <Icon
      className="image-placeholder"
      size={size}
      strokeWidth={1.1}
      aria-hidden="true"
    />
  );
}

export function MenuButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openMenu } = useMenu();
  return (
    <button className={className} onClick={() => openMenu()}>
      {children}
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  );
}

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { openMenu } = useMenu();
  return (
    <article className={`product-card product-${product.id}`}>
      <button
        className="product-image-button"
        aria-label={`View ${product.name}`}
        onClick={() => openMenu("product", product)}
      >
        <Image
          className="product-scene"
          src={assets.hero}
          alt=""
          fill
          sizes="(max-width: 767px) 84vw, 30vw"
        />
        <span className="product-index" aria-hidden="true">
          0{index + 1}
        </span>
        <span className="product-category">{product.category}</span>
        <div className="product-image">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 82vw, 30vw"
          />
        </div>
        <span className="product-note script" aria-hidden="true">
          {product.note}
        </span>
      </button>
      <div className="product-info">
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          {product.price !== null && (
            <span className="product-price">{product.price} MAD</span>
          )}
        </div>
        <button
          className="product-plus"
          onClick={() => openMenu("product", product)}
          aria-label={`Details for ${product.name}`}
        >
          <Plus size={21} strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
