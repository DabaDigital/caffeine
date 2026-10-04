"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { ArrowUpRight, Search, Star, X, type LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MenuCategory, MenuProduct } from "@/lib/content";
import { useMenu } from "@/components/menu/MenuProvider";
import { categoryIconComponents } from "@/components/icons";
import { currency, formatPrice } from "@/lib/site";
import { useSiteMotion } from "./Motion";
import { Pager } from "./Pager";
import { ShimmerImage } from "./Skeleton";
import s from "./menu-browser.module.css";

/** Products per page: two columns of four on wide screens. */
const PAGE_SIZE = 8;

type Tab = {
  id: string;
  label: string;
  Icon: LucideIcon;
  description: string | null;
  items: MenuProduct[];
};

/** Lowercase without accents, so "creme" finds "Crème". */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase();
const toTerms = (query: string) => fold(query).split(/\s+/).filter(Boolean);
const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
/** JPEGs can't be transparent, so they're photos that fill their frame;
 *  PNG and WebP cutouts float inside it. */
const fit = (src: string) =>
  /\.jpe?g(\?|$)/i.test(src) ? "cover" : "contain";
const calm = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wraps the parts of `text` matching a search term in <mark>. */
function highlight(text: string, terms: string[]): ReactNode {
  if (!terms.length) return text;
  // Fold one character at a time so matches map back to the original text.
  let folded = "";
  const origin: number[] = [];
  for (let index = 0; index < text.length; index++) {
    const part = fold(text[index]);
    folded += part;
    for (let i = 0; i < part.length; i++) origin.push(index);
  }
  const marked = new Array<boolean>(text.length).fill(false);
  for (const term of terms)
    for (
      let at = folded.indexOf(term);
      at !== -1;
      at = folded.indexOf(term, at + 1)
    )
      for (let i = at; i < at + term.length; i++) marked[origin[i]] = true;
  const parts: ReactNode[] = [];
  let start = 0;
  for (let index = 1; index <= text.length; index++) {
    if (index < text.length && marked[index] === marked[start]) continue;
    const slice = text.slice(start, index);
    parts.push(marked[start] ? <mark key={start}>{slice}</mark> : slice);
    start = index;
  }
  return parts;
}

/**
 * The menu as the café's screen: a tab per category (house favorites
 * first), pages of eight, and a search across everything. Every page is in
 * the HTML for search engines; hidden pages load their photos when shown.
 */
export function MenuBrowser({
  products,
  categories,
}: {
  products: MenuProduct[];
  categories: MenuCategory[];
}) {
  const { openMenu } = useMenu();
  const { paused } = useSiteMotion();
  const tabs = useMemo(() => {
    const list: Tab[] = [];
    const favorites = products.filter((product) => product.featured);
    if (favorites.length)
      list.push({
        id: "favorites",
        label: "Favorites",
        Icon: Star,
        description: "Start here, if you can’t decide.",
        items: favorites,
      });
    for (const category of categories) {
      const items = products.filter(
        (product) => product.categoryId === category.id,
      );
      if (items.length)
        list.push({
          id: category.id,
          label: category.name,
          Icon: categoryIconComponents[category.icon],
          description: category.description,
          items,
        });
    }
    return list;
  }, [products, categories]);

  // Open on the favorites when they fill most of a page, else the first category.
  const [tabId, setTabId] = useState(
    () =>
      (tabs[0]?.id === "favorites" && tabs[0].items.length < 4
        ? tabs[1]?.id
        : tabs[0]?.id) ?? "",
  );
  const [pageOf, setPageOf] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [resultPage, setResultPage] = useState(0);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const markFailed = (src: string) =>
    setFailed((previous) => new Set(previous).add(src));

  const terms = useMemo(() => toTerms(query), [query]);
  const searching = terms.length > 0;
  const searchText = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          fold(
            [
              product.name,
              product.category,
              product.description,
              product.badge ?? "",
              product.tagline ?? "",
              ...product.ingredients,
            ].join(" "),
          ),
        ]),
      ),
    [products],
  );
  const results = useMemo(
    () =>
      searching
        ? products.filter((product) =>
            terms.every((term) => searchText.get(product.id)!.includes(term)),
          )
        : [],
    [products, searchText, searching, terms],
  );

  const tab = tabs.find((item) => item.id === tabId) ?? tabs[0];
  const list = searching ? results : (tab?.items ?? []);
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(
    searching ? resultPage : (pageOf[tab?.id ?? ""] ?? 0),
    pageCount - 1,
  );
  const pageItems = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const spot =
    pageItems.find((product) => product.id === spotId) ?? pageItems[0] ?? null;

  const stage = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const tablist = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Page and tab changes: the current rows leave quickly, the new ones fold
  // in from the top of the screen.
  const exit = useRef<gsap.core.Tween | null>(null);
  const leaving = useRef<Element[]>([]);
  const entering = useRef(false);
  const liveRows = () =>
    Array.from(body.current?.querySelectorAll('[data-live="true"] > li') ?? []);
  function change(update: () => void) {
    exit.current?.kill();
    const rows = liveRows();
    if (!rows.length || paused || calm()) {
      update();
      return;
    }
    leaving.current = rows;
    exit.current = gsap.to(rows, {
      opacity: 0,
      y: -10,
      duration: 0.15,
      stagger: 0.012,
      ease: "power2.out",
      onComplete: () => {
        exit.current = null;
        entering.current = true;
        flushSync(update);
        if (!entering.current) return;
        // Nothing changed after all: bring the rows back.
        entering.current = false;
        gsap.set(rows, { clearProps: "opacity,transform" });
        leaving.current = [];
      },
    });
  }
  useLayoutEffect(() => {
    if (leaving.current.length) {
      gsap.set(leaving.current, { clearProps: "opacity,transform" });
      leaving.current = [];
    }
    if (!entering.current) return;
    entering.current = false;
    gsap.fromTo(
      liveRows(),
      { opacity: 0, y: 18, rotationX: -32 },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.5,
        stagger: 0.035,
        ease: "power3.out",
        transformOrigin: "50% 0%",
        clearProps: "opacity,transform",
      },
    );
  }, [tabId, page, searching]);

  function selectTab(id: string) {
    if (!searching && id === tab?.id) return;
    change(() => {
      setQuery("");
      setTabId(id);
      setSpotId(null);
    });
  }
  function goPage(next: number) {
    const target = Math.max(0, Math.min(pageCount - 1, next));
    if (target === page) return;
    change(() => {
      if (searching) setResultPage(target);
      else if (tab) setPageOf((old) => ({ ...old, [tab.id]: target }));
      setSpotId(null);
    });
  }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    document.getElementById(`menu-tab-${tabs[next].id}`)?.focus();
    selectTab(tabs[next].id);
  }

  // Keep the selected tab in view inside the scrolling tab strip.
  useEffect(() => {
    const strip = tablist.current;
    const active = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!strip || !active || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({
      left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2,
      behavior: calm() ? "auto" : "smooth",
    });
  }, [tabId]);

  // Swipe sideways on touch screens to turn the page.
  const touch = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch" || !event.isPrimary) return;
    touch.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = touch.current;
    touch.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    swiped.current = true;
    goPage(page + (dx < 0 ? 1 : -1));
  }
  // A swipe that ends on a product shouldn't also open it.
  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!swiped.current) return;
    swiped.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  // The screen rises onto the wall once, then tilts a little with the mouse.
  useEffect(() => {
    const screen = board.current;
    const holder = stage.current;
    if (!screen || !holder || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        if (!context.conditions?.motion) return;
        gsap.from(screen, {
          y: 70,
          rotationX: 14,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: holder, start: "top 88%", once: true },
        });
        if (!context.conditions.fine) return;
        const tiltX = gsap.quickTo(screen, "rotationX", {
          duration: 0.9,
          ease: "power3.out",
        });
        const tiltY = gsap.quickTo(screen, "rotationY", {
          duration: 0.9,
          ease: "power3.out",
        });
        const move = (event: globalThis.PointerEvent) => {
          const box = screen.getBoundingClientRect();
          tiltX(((event.clientY - box.top) / box.height - 0.5) * -3);
          tiltY(((event.clientX - box.left) / box.width - 0.5) * 4);
        };
        const reset = () => {
          tiltX(0);
          tiltY(0);
        };
        screen.addEventListener("pointermove", move);
        screen.addEventListener("pointerleave", reset);
        return () => {
          screen.removeEventListener("pointermove", move);
          screen.removeEventListener("pointerleave", reset);
        };
      },
    );
    return () => media.revert();
  }, [paused]);

  const open = (product: MenuProduct) => openMenu("product", product);
  const status = searching
    ? `${plural(results.length, "result")} for “${query.trim()}”`
    : tab
      ? `${tab.label}, page ${page + 1} of ${pageCount}`
      : "";

  function pages(
    panel: string,
    title: string,
    description: string | null,
    items: MenuProduct[],
    current: number,
    live: boolean,
  ) {
    const groups = chunk(items, PAGE_SIZE);
    return (
      <>
        <div className={s.listHead}>
          <div>
            <h3 className={s.panelTitle}>{title}</h3>
            {description && (
              <p className={s.panelDescription}>{description}</p>
            )}
          </div>
          <p className={s.pageInfo}>
            {groups.length > 1
              ? `Page ${current + 1} / ${groups.length}`
              : plural(items.length, "item")}
          </p>
        </div>
        {groups.map((group, index) => (
          <ul
            key={index}
            className={s.items}
            hidden={index !== current}
            data-paged={groups.length > 1 || undefined}
            data-live={live && index === current ? "true" : undefined}
          >
            {group.map((product) => (
              <Item
                key={product.id}
                id={`${panel}-${product.id}`}
                product={product}
                terms={terms}
                failed={failed}
                onFail={markFailed}
                onOpen={open}
                onSpot={setSpotId}
              />
            ))}
          </ul>
        ))}
        {live && (
          <Pager
            className={s.pager}
            label={`${title} pages`}
            count={groups.length}
            page={current}
            onPage={goPage}
          />
        )}
      </>
    );
  }

  if (!tabs.length)
    return (
      <div className={s.brewing}>
        <h3>Our menu is brewing.</h3>
        <p>Visit the café to discover today’s selection.</p>
      </div>
    );

  return (
    <div className={s.stage} ref={stage}>
      <div className={s.board} ref={board}>
        <div className={s.screen}>
          <div className={s.top}>
            <div
              ref={tablist}
              className={s.tabs}
              role="tablist"
              aria-label="Menu categories"
            >
              {tabs.map((item, index) => {
                const selected = !searching && item.id === tab?.id;
                return (
                  <button
                    key={item.id}
                    id={`menu-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`menu-panel-${item.id}`}
                    tabIndex={selected || (searching && index === 0) ? 0 : -1}
                    className={s.tab}
                    onClick={() => selectTab(item.id)}
                    onKeyDown={(event) => onTabKey(event, index)}
                  >
                    <item.Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                    {item.label}
                    <small>{item.items.length}</small>
                  </button>
                );
              })}
            </div>
            <label className={s.search}>
              <Search size={17} strokeWidth={1.6} aria-hidden="true" />
              <span className="sr-only">Search the menu</span>
              <input
                ref={input}
                type="search"
                value={query}
                placeholder="Search the menu"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setResultPage(0);
                  setSpotId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && query) {
                    event.preventDefault();
                    setQuery("");
                  }
                }}
              />
              {query && (
                <button
                  type="button"
                  className={s.clear}
                  onClick={() => {
                    setQuery("");
                    input.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          <div
            ref={body}
            className={s.body}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (touch.current = null)}
            onClickCapture={onClickCapture}
          >
            <Spotlight product={spot} failed={failed} onOpen={open} />
            <div className={s.panels}>
              {tabs.map((item) => (
                <div
                  key={item.id}
                  id={`menu-panel-${item.id}`}
                  role="tabpanel"
                  aria-labelledby={`menu-tab-${item.id}`}
                  hidden={searching || item.id !== tab?.id}
                  className={s.panel}
                >
                  {pages(
                    item.id,
                    item.label,
                    item.description,
                    item.items,
                    item.id === tab?.id ? page : (pageOf[item.id] ?? 0),
                    !searching && item.id === tab?.id,
                  )}
                </div>
              ))}
              {searching && (
                <div
                  className={s.panel}
                  role="region"
                  aria-label="Search results"
                >
                  {results.length ? (
                    pages(
                      "results",
                      `Results for “${query.trim()}”`,
                      null,
                      results,
                      page,
                      true,
                    )
                  ) : (
                    <div className={s.empty}>
                      <h3>Nothing matches “{query.trim()}”.</h3>
                      <p>Try another word, or pick a category:</p>
                      <div className={s.suggestions}>
                        {tabs.slice(0, 5).map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => selectTab(item.id)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={s.reset}
                        onClick={() => {
                          setQuery("");
                          input.current?.focus();
                        }}
                      >
                        Clear search <ArrowUpRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className={s.footnote}>
        Prices in {currency} · Orders are taken in the café · Ask our team
        about allergens
      </p>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

function Item({
  id,
  product,
  terms,
  failed,
  onFail,
  onOpen,
  onSpot,
}: {
  id: string;
  product: MenuProduct;
  terms: string[];
  failed: ReadonlySet<string>;
  onFail: (src: string) => void;
  onOpen: (product: MenuProduct) => void;
  onSpot: (id: string) => void;
}) {
  const image =
    product.image && !failed.has(product.image) ? product.image : null;
  return (
    <li>
      <button
        type="button"
        className={s.item}
        onClick={() => onOpen(product)}
        onPointerEnter={() => onSpot(product.id)}
        onFocus={() => onSpot(product.id)}
        aria-labelledby={`${id}-name ${id}-price`}
        aria-describedby={product.description ? `${id}-description` : undefined}
      >
        <span className={s.thumb} aria-hidden="true">
          {image ? (
            <ShimmerImage
              src={image}
              alt=""
              fill
              sizes="64px"
              className={s.fill}
              data-fit={fit(image)}
              onError={() => onFail(image)}
            />
          ) : (
            <span className={s.monogram}>{product.name.trim().charAt(0)}</span>
          )}
        </span>
        <span className={s.itemBody}>
          <span className={s.itemHead}>
            <span id={`${id}-name`} className={s.itemName}>
              {highlight(product.name, terms)}
            </span>
            <span className={s.leader} aria-hidden="true" />
            <span id={`${id}-price`}>
              <Price product={product} />
            </span>
          </span>
          {product.description && (
            <span id={`${id}-description`} className={s.itemDescription}>
              {highlight(product.description, terms)}
            </span>
          )}
          {(product.offer || product.badge) && (
            <span className={s.itemTags}>
              {product.offer && (
                <span className={s.offerTag}>
                  {product.offer.label} · {product.offer.title}
                </span>
              )}
              {product.badge && <span className={s.badge}>{product.badge}</span>}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** A large preview of the product under the pointer (wide screens only). */
function Spotlight({
  product,
  failed,
  onOpen,
}: {
  product: MenuProduct | null;
  failed: ReadonlySet<string>;
  onOpen: (product: MenuProduct) => void;
}) {
  if (!product) return <div className={s.spotlight} aria-hidden="true" />;
  const image =
    product.image && !failed.has(product.image) ? product.image : null;
  const Icon = categoryIconComponents[product.categoryIcon];
  // Repeats the selected row for mouse users, so it stays out of the
  // accessibility tree and the tab order.
  return (
    <div className={s.spotlight} aria-hidden="true">
      <button
        key={product.id}
        type="button"
        tabIndex={-1}
        className={s.spotCard}
        onClick={() => onOpen(product)}
      >
        <span className={s.spotPhoto}>
          {image ? (
            <ShimmerImage
              src={image}
              alt=""
              fill
              sizes="360px"
              className={s.fill}
              data-fit={fit(image)}
            />
          ) : (
            <Icon className={s.spotIcon} strokeWidth={0.9} />
          )}
          {product.badge && (
            <span className={s.spotBadge}>{product.badge}</span>
          )}
        </span>
        <span className={s.spotCategory}>{product.category}</span>
        <span className={s.spotName}>{product.name}</span>
        {product.tagline && (
          <span className={s.spotTagline}>{product.tagline}</span>
        )}
        <span className={s.spotFoot}>
          <Price product={product} />
          <span className={s.spotMore}>
            Details <ArrowUpRight size={15} strokeWidth={1.6} />
          </span>
        </span>
      </button>
    </div>
  );
}

function Price({ product }: { product: MenuProduct }) {
  if (product.price === null)
    return <span className={s.ask}>Ask in café</span>;
  return (
    <span className={s.price}>
      <span>
        {formatPrice(product.offer?.price ?? product.price)}
        <small> {currency}</small>
      </span>
      {product.offer && (
        <s>
          <span className="sr-only">instead of </span>
          {formatPrice(product.price)}
        </s>
      )}
    </span>
  );
}
