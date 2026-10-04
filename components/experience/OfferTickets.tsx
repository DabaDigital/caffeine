"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Coffee } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SiteOffer } from "@/lib/content";
import { cafeToday, currency, formatPrice, shortDate } from "@/lib/site";
import { useSiteMotion } from "./Motion";
import { Pager } from "./Pager";
import { ShimmerImage } from "./Skeleton";
import s from "./offers.module.css";

const noSubscription = () => () => {};
/** Today in Casablanca, read on the client so cached HTML never goes stale. */
const useCafeToday = () =>
  useSyncExternalStore(noSubscription, () => cafeToday(), () => null);

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
 * Offers as tear-off tickets in a sideways carousel. They print out of a
 * slot as the section arrives and tilt under the pointer.
 */
export function OfferTickets({ offers }: { offers: SiteOffer[] }) {
  const today = useCafeToday();
  const { paused } = useSiteMotion();
  const track = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ page: 0, count: 1, step: 0, perView: 1 });

  // Pages follow how many tickets fit; the current page follows the scroll.
  useEffect(() => {
    const element = track.current;
    const list = element?.firstElementChild;
    if (!element || !list) return;
    const measure = () => {
      const first = list.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const step = first.offsetWidth + gap;
      const perView = Math.max(
        1,
        Math.floor((element.clientWidth + gap + 2) / step),
      );
      const count = Math.max(1, Math.ceil(offers.length / perView));
      const page = Math.min(
        count - 1,
        Math.round(element.scrollLeft / (step * perView)),
      );
      setView((old) =>
        old.page === page &&
        old.count === count &&
        old.step === step &&
        old.perView === perView
          ? old
          : { page, count, step, perView },
      );
    };
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [offers.length]);

  function goPage(page: number) {
    track.current?.scrollTo({
      left: page * view.perView * view.step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
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
        const tickets = gsap.utils.toArray<HTMLElement>("[data-ticket]", element);
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

  return (
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
            {offers.length} offers · swipe or use the arrows
          </p>
          <Pager
            label="Offer pages"
            count={view.count}
            page={view.page}
            onPage={goPage}
          />
        </div>
      )}
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
