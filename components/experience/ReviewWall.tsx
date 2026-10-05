"use client";

import {
  Children,
  createContext,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSiteMotion } from "./Motion";
import { Pager } from "./Pager";
import s from "./reviews.module.css";

const PER_PAGE = 2;
/** Sideways travel, in px, that turns the page under a finger. */
const SWIPE = 48;

const pad = (value: number) => String(value).padStart(2, "0");
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PageShown = createContext(true);
/** False while a review sits on a page that is not showing. */
export const usePageShown = () => useContext(PageShown);

/**
 * Review cards, two to a page. Every page stays in the HTML, stacked in one
 * grid cell, so the wall keeps the height of its tallest page and the pager
 * never moves under the pointer. A short last page ends with `filler`.
 */
export function ReviewWall({
  children,
  filler,
}: {
  children: ReactNode;
  filler?: ReactNode;
}) {
  const cards = Children.toArray(children);
  const items =
    filler && cards.length % PER_PAGE
      ? [...cards, <Fragment key="filler">{filler}</Fragment>]
      : cards;
  const pages = Array.from(
    { length: Math.ceil(items.length / PER_PAGE) },
    (_, index) => items.slice(index * PER_PAGE, (index + 1) * PER_PAGE),
  );
  const [page, setPage] = useState(0);
  const current = Math.min(page, pages.length - 1);
  const stage = useRef<HTMLDivElement>(null);
  /** The page being left, kept from a turn until its animation starts. */
  const leaving = useRef<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { paused } = useSiteMotion();

  function turn(next: number) {
    if (next < 0 || next >= pages.length || next === current) return;
    leaving.current = current;
    setPage(next);
  }

  // The first page's stars fill as the wall scrolls into view.
  useEffect(() => {
    const element = stage.current;
    if (!element || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        element.querySelectorAll(":scope > [data-current] [data-star-fill]"),
        { "--fill": 0 },
        {
          "--fill": 1,
          duration: 0.9,
          delay: 0.25,
          ease: "power2.inOut",
          stagger: 0.12,
          clearProps: "--fill",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        },
      );
    });
    return () => media.revert();
  }, [paused]);

  // A turn reads like a page in a book: the old cards slip out one way, the
  // new ones follow in from the other side and their stars fill again.
  useLayoutEffect(() => {
    const from = leaving.current;
    leaving.current = null;
    const element = stage.current;
    if (from === null || !element || paused || reducedMotion()) return;
    const lists = element.querySelectorAll<HTMLElement>(":scope > ul");
    const out = lists[from];
    const into = lists[current];
    if (!out || !into) return;
    const direction = current > from ? 1 : -1;
    // The card nearest the way of travel moves first.
    const lead = direction > 0 ? "start" : "end";
    const outgoing = gsap.utils.toArray<HTMLElement>(out.children);
    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { overwrite: "auto" } })
        // The old page stays visible, though inert, while it leaves; set
        // before the next paint so it never blinks out first.
        .set(out, { visibility: "visible", immediateRender: true }, 0)
        .to(
          outgoing,
          {
            x: -36 * direction,
            opacity: 0,
            duration: 0.28,
            ease: "power2.inOut",
            stagger: { each: 0.03, from: lead },
          },
          0,
        )
        .set([out, ...outgoing], { clearProps: "visibility,transform,opacity" })
        .fromTo(
          into.children,
          { x: 64 * direction, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: { each: 0.08, from: lead },
            clearProps: "transform,opacity",
          },
          0.24,
        )
        .fromTo(
          into.querySelectorAll("[data-star-fill]"),
          { "--fill": 0 },
          {
            "--fill": 1,
            duration: 0.8,
            ease: "power2.inOut",
            stagger: 0.1,
            clearProps: "--fill",
          },
          0.4,
        );
    });
    return () => context.revert();
  }, [current, paused]);

  return (
    <div className={s.wallRegion}>
      <div
        ref={stage}
        className={s.wallStage}
        // A soft light follows the mouse across the card under it.
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const card = (event.target as Element).closest<HTMLElement>(
            "[data-card]",
          );
          if (!card) return;
          const box = card.getBoundingClientRect();
          card.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
          card.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
        }}
        // A sideways swipe turns the page; anything steeper is a scroll.
        onTouchStart={(event) => {
          const first = event.touches[0];
          touch.current =
            event.touches.length === 1
              ? { x: first.clientX, y: first.clientY }
              : null;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          const end = event.changedTouches[0];
          touch.current = null;
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          turn(current + (dx < 0 ? 1 : -1));
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
      >
        {pages.map((group, index) => (
          <PageShown.Provider key={index} value={index === current}>
            <ul
              className={s.wall}
              data-current={index === current ? "" : undefined}
              data-stagger={index === 0 ? "" : undefined}
              inert={index !== current}
            >
              {group}
            </ul>
          </PageShown.Provider>
        ))}
      </div>
      {pages.length > 1 && (
        <div className={s.wallFooter}>
          <p className={s.wallStatus} aria-live="polite">
            <span className="sr-only">
              Page {current + 1} of {pages.length}
            </span>
            <span aria-hidden="true">
              <strong key={current}>{pad(current + 1)}</strong> /{" "}
              {pad(pages.length)}
            </span>
          </p>
          <span className={s.wallTrack} aria-hidden="true">
            <span
              style={
                { "--page": current, "--pages": pages.length } as CSSProperties
              }
            />
          </span>
          <Pager
            className={s.pager}
            label="Review pages"
            count={pages.length}
            page={current}
            onPage={turn}
          />
        </div>
      )}
    </div>
  );
}
