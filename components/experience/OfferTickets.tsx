"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Coffee } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SiteOffer } from "@/lib/content";
import { cafeToday, currency, formatPrice, shortDate } from "@/lib/site";
import { useSiteMotion } from "./Motion";
import { watchScrollLayout } from "./scroll-layout";
import { ShimmerImage } from "./Skeleton";
import s from "./offers.module.css";

const noSubscription = () => () => {};
/** Today in Casablanca, read on the client so cached HTML never goes stale. */
const useCafeToday = () =>
  useSyncExternalStore(
    noSubscription,
    () => cafeToday(),
    () => null,
  );

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );

function ending(until: string | null, today: string | null) {
  if (!until) return { text: "While it lasts", soon: false };
  if (!today) return { text: `Until ${shortDate(until)}`, soon: false };
  const days = daysBetween(today, until);
  if (days <= 0) return { text: "Last day today", soon: true };
  if (days === 1) return { text: "Ends tomorrow", soon: true };
  if (days <= 7) return { text: `Ends in ${days} days`, soon: days <= 3 };
  return { text: `Until ${shortDate(until)}`, soon: false };
}

/**
 * Offers as tear-off tickets in a sideways row. They print out of a slot as
 * the section arrives and tilt under the pointer. With motion on, the heading
 * and tickets hold still under the header while scrolling the page glides
 * the row along; otherwise the row scrolls sideways on its own.
 */
export function OfferTickets({
  offers,
  children,
}: {
  offers: SiteOffer[];
  /** The section heading, held in view with the tickets. */
  children: ReactNode;
}) {
  const today = useCafeToday();
  const { paused, scrollTo } = useSiteMotion();
  const runway = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  /** Set while page scroll drives the row instead of its own scrollbar. */
  const rail = useRef<{
    trigger: ScrollTrigger;
    travel: number;
  } | null>(null);
  const [view, setView] = useState({ page: 0, count: 1, step: 0, perView: 1 });
  const geometry = useRef(view);
  const [scrollDriven, setScrollDriven] = useState(false);

  // Pages follow how many tickets fit; the current page follows the scroll.
  const measure = useCallback(() => {
    const element = track.current;
    const list = element?.firstElementChild;
    const first = list?.firstElementChild as HTMLElement | null | undefined;
    if (!element || !list || !first) return;
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const step = first.offsetWidth + gap;
    const perView = Math.max(
      1,
      Math.floor((element.clientWidth + gap + 2) / step),
    );
    const count = Math.max(1, Math.ceil(offers.length / perView));
    // Scroll-driven, the target scroll position decides, not where the
    // smoothed row happens to be, so the slider never fights a drag.
    const driven = rail.current;
    const offset = driven
      ? driven.travel * driven.trigger.progress
      : element.scrollLeft;
    const end = driven
      ? driven.travel
      : element.scrollWidth - element.clientWidth;
    const page = Math.min(
      count - 1,
      offset >= end - 2 ? count - 1 : Math.round(offset / (step * perView)),
    );
    geometry.current = { page, count, step, perView };
    setView((old) =>
      old.page === page &&
      old.count === count &&
      old.step === step &&
      old.perView === perView
        ? old
        : { page, count, step, perView },
    );
  }, [offers.length]);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  // The controls appear after measuring and make the section taller, which
  // moves every scroll scene below it.
  const hasControls = view.count > 1;
  useEffect(() => {
    if (hasControls) ScrollTrigger.refresh();
  }, [hasControls]);

  function goPage(page: number, immediate = false) {
    const driven = rail.current;
    // Scroll-driven, go to the page scroll at which the row rests there.
    if (driven?.travel) {
      const { start, end } = driven.trigger;
      scrollTo(
        start + (end - start) * Math.min(1, page * view.perView * view.step / driven.travel),
        immediate,
      );
      return;
    }
    track.current?.scrollTo({
      left: page * view.perView * view.step,
      behavior:
        immediate ||
        paused ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  }

  useEffect(() => {
    const element = track.current;
    if (!element || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        if (!context.conditions?.motion) return;
        const tickets = gsap.utils.toArray<HTMLElement>(
          "[data-ticket]",
          element,
        );
        // Printed one by one, from the top down.
        gsap.fromTo(
          tickets,
          { clipPath: "inset(0% 0% 100% 0%)", y: -30, rotation: -1.4 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            rotation: 0,
            duration: 1,
            stagger: 0.14,
            ease: "power3.out",
            clearProps: "clipPath,transform",
            scrollTrigger: { trigger: element, start: "top 85%", once: true },
          },
        );
        if (!context.conditions.fine) return;
        const cleanups = tickets.map((ticket) => {
          const tiltX = gsap.quickTo(ticket, "rotationX", {
            duration: 0.6,
            ease: "power3.out",
          });
          const tiltY = gsap.quickTo(ticket, "rotationY", {
            duration: 0.6,
            ease: "power3.out",
          });
          const move = (event: PointerEvent) => {
            const box = ticket.getBoundingClientRect();
            tiltX(((event.clientY - box.top) / box.height - 0.5) * -8);
            tiltY(((event.clientX - box.left) / box.width - 0.5) * 10);
          };
          const reset = () => {
            tiltX(0);
            tiltY(0);
          };
          ticket.addEventListener("pointermove", move);
          ticket.addEventListener("pointerleave", reset);
          return () => {
            ticket.removeEventListener("pointermove", move);
            ticket.removeEventListener("pointerleave", reset);
          };
        });
        return () => cleanups.forEach((cleanup) => cleanup());
      },
    );
    return () => media.revert();
  }, [paused, offers.length]);

  // With motion on, the heading and tickets hold still under the header for
  // as long as the row takes to glide past: Lenis smooths the page scroll and
  // GSAP scrubs it into the pass. Phones and desktops alike, given the height.
  useEffect(() => {
    const frame = runway.current;
    const held = stage.current;
    const element = track.current;
    const list = element?.firstElementChild;
    if (!frame || !held || !element || !(list instanceof HTMLElement) || paused)
      return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      {
        motion:
          "(prefers-reduced-motion: no-preference) and (min-height: 560px)",
        // Re-planned whenever a different number of tickets fits.
        narrow: "(max-width: 599px)",
        wide: "(min-width: 900px)",
      },
      (context) => {
        if (!context.conditions?.motion) return;
        // How far the row reaches past the space it shows in.
        const overhang = () => {
          const first = list.firstElementChild as HTMLElement | null;
          const last = list.lastElementChild as HTMLElement | null;
          if (!first || !last) return 0;
          const box = getComputedStyle(element);
          const visible =
            element.clientWidth -
            parseFloat(box.paddingLeft) -
            parseFloat(box.paddingRight);
          return Math.max(
            0,
            Math.round(
              last.offsetLeft + last.offsetWidth - first.offsetLeft - visible,
            ),
          );
        };
        // Every ticket already fits: nothing to slide.
        if (!overhang()) return;

        const slide = gsap.quickSetter(list, "x", "px");
        const position = { value: 0 };
        let travel = 0;
        let hold = 0;
        // Before every measure: the overhang sets how long the section holds,
        // and how tall the stage is decides where it sticks.
        const layout = () => {
          travel = overhang();
          hold = travel;
          frame.style.setProperty("--hold", `${hold}px`);
          frame.style.setProperty("--stage-height", `${held.offsetHeight}px`);
          if (rail.current) Object.assign(rail.current, { travel });
        };
        const render = () => {
          const offset = travel * position.value;
          slide(-offset);
          meter.current?.style.setProperty(
            "--progress",
            String(travel ? offset / travel : 0),
          );
        };

        frame.dataset.horizontal = "on";
        element.scrollLeft = 0;
        layout();
        const tween = gsap.to(position, {
          value: 1,
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            trigger: frame,
            // Where the stage sticks: under the header, or higher when it is
            // taller than the screen and sticks by its bottom edge instead.
            start: () => `top ${parseFloat(getComputedStyle(held).top) || 0}px`,
            end: () => `+=${hold}`,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: () => {
              // Layout is measured on resize, never for every scroll frame.
              const next = Math.min(geometry.current.count - 1, Math.round(travel * position.value / (geometry.current.step * geometry.current.perView)));
              if (geometry.current.page !== next) {
                geometry.current.page = next;
                setView((old) => ({ ...old, page: next }));
              }
            },
            onRefresh: render,
          },
        });
        rail.current = { trigger: tween.scrollTrigger!, travel };
        ScrollTrigger.addEventListener("refreshInit", layout);
        const unwatch = watchScrollLayout([held, element, list]);
        setScrollDriven(true);
        ScrollTrigger.refresh();
        measure();
        return () => {
          unwatch();
          ScrollTrigger.removeEventListener("refreshInit", layout);
          rail.current = null;
          delete frame.dataset.horizontal;
          frame.style.removeProperty("--hold");
          frame.style.removeProperty("--stage-height");
          gsap.set(list, { clearProps: "transform" });
          setScrollDriven(false);
          measure();
        };
      },
    );
    return () => media.revert();
  }, [paused, measure]);

  return (
    <div ref={runway} className={s.runway}>
      <div ref={stage} className={s.inner}>
        {children}
        <div className={s.carousel}>
          <div className={s.printer} aria-hidden="true">
            <span />
          </div>
          <div
            ref={track}
            className={s.track}
            role="region"
            aria-label="Offers"
            tabIndex={0}
            onKeyDown={(event) => {
              const page =
                event.key === "ArrowRight"
                  ? view.page + 1
                  : event.key === "ArrowLeft"
                    ? view.page - 1
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? view.count - 1
                        : null;
              if (page === null) return;
              event.preventDefault();
              goPage(Math.max(0, Math.min(view.count - 1, page)), true);
            }}
          >
            <ul className={s.list}>
              {offers.map((offer, index) => (
                <Ticket
                  key={offer.id}
                  offer={offer}
                  serial={index + 1}
                  ending={ending(offer.until, today)}
                />
              ))}
            </ul>
          </div>
          {view.count > 1 && (
            <div className={s.controls}>
              <p className={s.count}>
                {scrollDriven ? "Scroll" : "Swipe"} to discover ·{" "}
                {offers.length} offers
              </p>
              <div className={s.progress}>
                <span
                  ref={meter}
                  className={s.progressTrack}
                  aria-hidden="true"
                >
                  <span
                    style={
                      {
                        width: `${100 / view.count}%`,
                        "--page": view.page,
                        "--pages": view.count,
                      } as CSSProperties
                    }
                  />
                </span>
                <input
                  type="range"
                  min={0}
                  max={view.count - 1}
                  value={view.page}
                  aria-label="Browse offers"
                  aria-valuetext={`Offer page ${view.page + 1} of ${view.count}`}
                  onChange={(event) => goPage(Number(event.target.value), true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Ticket({
  offer,
  serial,
  ending,
}: {
  offer: SiteOffer;
  serial: number;
  ending: { text: string; soon: boolean };
}) {
  const together = offer.bundle || offer.items.length === 1;
  const titleId = `offer-${offer.id}`;
  return (
    <li className={s.slot}>
      <article className={s.ticket} data-ticket aria-labelledby={titleId}>
        <div className={s.main}>
          <div className={s.photos} aria-hidden="true">
            {offer.items.slice(0, 3).map(({ product }) => (
              <span key={product.id} className={s.photo}>
                {product.image ? (
                  <ShimmerImage
                    src={product.image}
                    alt=""
                    fill
                    sizes="64px"
                    className={s.fill}
                  />
                ) : (
                  <Coffee size={22} strokeWidth={1.3} />
                )}
              </span>
            ))}
          </div>
          <p className={s.kicker}>
            {offer.bundle
              ? "Better together"
              : together
                ? "Special price"
                : `${offer.items.length} favorites`}
          </p>
          <h3 id={titleId} className={s.title}>
            {offer.title}
          </h3>
          {offer.description && (
            <p className={s.description}>{offer.description}</p>
          )}
          {together ? (
            <>
              <p className={s.products}>
                {offer.items.map(({ product }) => product.name).join(" + ")}
              </p>
              <p className={s.total}>
                <strong>{formatPrice(offer.offer)}</strong>
                <small>{currency}</small>
                <s>
                  <span className="sr-only">instead of </span>
                  {formatPrice(offer.regular)} {currency}
                </s>
              </p>
            </>
          ) : (
            <ul className={s.lines}>
              {offer.items.map(({ product, price, regular }) => (
                <li key={product.id}>
                  <span>{product.name}</span>
                  <span className={s.dots} aria-hidden="true" />
                  <span className={s.linePrice}>
                    <strong>
                      {formatPrice(price)} {currency}
                    </strong>{" "}
                    <s>
                      <span className="sr-only">instead of </span>
                      {formatPrice(regular)}
                    </s>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className={s.foot}>
            <span>
              {together
                ? `Save ${formatPrice(offer.saving)} ${currency}`
                : "In café only"}
            </span>
            <span className={s.ending} data-soon={ending.soon || undefined}>
              {ending.text}
            </span>
          </p>
        </div>
        <div className={s.stub}>
          <span className={s.stubLabel}>{offer.label}</span>
          <span className={s.stubNote} aria-hidden="true">
            {offer.bundle ? "deal" : "off"}
          </span>
          <span className={s.barcode} aria-hidden="true" />
          <span className={s.serial} aria-hidden="true">
            Nº {String(serial).padStart(3, "0")}
          </span>
        </div>
      </article>
    </li>
  );
}
