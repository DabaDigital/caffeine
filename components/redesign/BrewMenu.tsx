"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Coffee, Search, X } from "lucide-react";
import { animate, stagger } from "animejs";
import type { MenuCategory, MenuProduct } from "@/lib/content";
import { formatPrice } from "@/lib/site";
import { useMenu } from "@/components/menu/MenuProvider";
import s from "./brew.module.css";

const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function BrewMenu({
  products,
  categories,
}: {
  products: MenuProduct[];
  categories: MenuCategory[];
}) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { openMenu } = useMenu();
  const grid = useRef<HTMLDivElement>(null);
  const filtered = products.filter(
    (item) =>
      (category === "all" || item.categoryId === category) &&
      searchable(`${item.name} ${item.description} ${item.ingredients.join(" ")}`).includes(searchable(query).trim()),
  );
  if (category === "all" && !query) filtered.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(!!b.image) - Number(!!a.image));
  const visible =
    expanded || category !== "all" || query ? filtered : filtered.slice(0, 6);
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      grid.current?.closest('[data-motion="paused"]')
    )
      return;
    const animation = animate(grid.current!.children, {
      opacity: [0.4, 1],
      translateY: [12, 0],
      duration: 300,
      delay: stagger(35),
      ease: "out(3)",
    });
    return () => {
      animation.revert();
    };
  }, [category, query, expanded]);
  return (
    <>
      <div className={s.menuTools}>
        <div className={s.categories} role="group" aria-label="Menu categories">
          <button
            aria-pressed={category === "all"}
            onClick={() => {
              setCategory("all");
              setExpanded(false);
            }}
          >
            All the good stuff <span>{products.length}</span>
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.name}
              <span>
                {
                  products.filter((product) => product.categoryId === item.id)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div className={s.search}>
          <Search size={18} />
          <input
            type="search"
            aria-label="Search the menu"
            placeholder="Find your craving…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={17} />
            </button>
          )}
        </div>
      </div>
      <div className={s.products} ref={grid}>
        {visible.map((item, index) => (
          <button
            key={item.id}
            className={s.product}
            onClick={() => openMenu("product", item)}
            aria-label={`View ${item.name}`}
          >
            <div className={s.productVisual}>
              <span className={s.productNumber}>
                {String(index + 1).padStart(2, "0")} /{" "}
                {item.category.toUpperCase()}
              </span>
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 560px) 90vw, (max-width: 900px) 45vw, 30vw"
                />
              ) : (
                <Coffee className={s.noPhoto} size={56} strokeWidth={1} />
              )}
              <span className={s.productArrow}>
                <ArrowUpRight size={22} />
              </span>
              {item.badge && (
                <span className={s.productBadge}>{item.badge}</span>
              )}
            </div>
            <div className={s.productInfo}>
              <h3>{item.name}</h3>
              <span className={s.productPrice}>
                {item.price !== null ? (
                  <>
                    {formatPrice(item.offer?.price ?? item.price)}{" "}
                    <small>MAD</small>
                    {item.offer && <s>{formatPrice(item.price)}</s>}
                  </>
                ) : (
                  "Ask in café"
                )}
              </span>
              <p>{item.description}</p>
            </div>
          </button>
        ))}
      </div>
      {visible.length === 0 && (
        <div className={s.empty}>
          <Coffee size={28} />
          <h3>
            {products.length
              ? "No matching cravings. Yet."
              : "Something good is brewing."}
          </h3>
          <p>
            {products.length
              ? "Try another name or category."
              : "Our team can help you discover the menu in the café."}
          </p>
          {products.length > 0 && (
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Show the whole menu <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      )}
      <div className={s.menuBottom}>
        <p aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "favourite" : "favourites"}{" "}
          · Prices in MAD · Ask us about allergens
        </p>
        {category === "all" && !query && filtered.length > 6 && (
          <button
            className={s.textLink}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : `All ${filtered.length} favourites`}{" "}
            <ArrowUpRight size={18} />
          </button>
        )}
      </div>
    </>
  );
}
