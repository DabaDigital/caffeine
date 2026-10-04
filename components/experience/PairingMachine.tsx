"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ChevronDown, ChevronUp, Shuffle } from "lucide-react";
import { gsap } from "gsap";
import type { MenuProduct } from "@/lib/content";
import { useMenu } from "@/components/menu/MenuProvider";
import { categoryIconComponents } from "@/components/icons";
import { currency, formatPrice } from "@/lib/site";
import { useSiteMotion } from "./Motion";
import { ShimmerImage } from "./Skeleton";
import s from "./pairing.module.css";

export type PairingBundle = {
  title: string;
  price: number;
  regular: number;
  ids: string[];
};

/** Copies of each strip: the middle one, with a neighbour above and below.
 *  Spins wrap around the middle copy, so three are enough for any length. */
const LOOPS = 3;
/** The copy the reels rest in. */
const REST = 1;
const calm = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const priceOf = (product: MenuProduct) => product.offer?.price ?? product.price;
const fit = (src: string) =>
  /\.jpe?g(\?|$)/i.test(src) ? "cover" : "contain";

/** Where a strip rests to show item `index` in the middle of its window. */
function restY(strip: HTMLElement, count: number, index: number) {
  const face = strip.firstElementChild as HTMLElement | null;
  const frame = strip.parentElement;
  if (!face || !frame) return 0;
  return (
    -(REST * count + index) * face.offsetHeight +
    (frame.clientHeight - face.offsetHeight) / 2
  );
}

/** Maps any offset onto the middle copy, showing the same face. */
function wrapper(strip: HTMLElement, count: number) {
  const face = (strip.firstElementChild as HTMLElement).offsetHeight;
  const first = restY(strip, count, 0);
  return (y: number) => {
    const steps = (first - y) / face;
    return first - (((steps % count) + count) % count) * face;
  };
}

/**
 * Two reels, a drink and a bite. Pull the lever (or press spin) for a new
 * pairing; the first pull lands on a bundle deal when there is one.
 */
export default function PairingMachine({
  drinks,
  bites,
  bundles,
}: {
  drinks: MenuProduct[];
  bites: MenuProduct[];
  bundles: PairingBundle[];
}) {
  const { openMenu } = useMenu();
  const { paused } = useSiteMotion();
  const [picks, setPicks] = useState<[number, number]>([0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [spins, setSpins] = useState(0);
  const drinkStrip = useRef<HTMLDivElement>(null);
  const biteStrip = useRef<HTMLDivElement>(null);
  const lever = useRef<HTMLSpanElement>(null);

  // Rest the reels on the picks, and again whenever the window resizes.
  useLayoutEffect(() => {
    if (spinning) return;
    const place = () => {
      if (drinkStrip.current)
        gsap.set(drinkStrip.current, {
          y: restY(drinkStrip.current, drinks.length, picks[0]),
        });
      if (biteStrip.current)
        gsap.set(biteStrip.current, {
          y: restY(biteStrip.current, bites.length, picks[1]),
        });
    };
    place();
    const frame = drinkStrip.current?.parentElement;
    if (!frame) return;
    const observer = new ResizeObserver(place);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [picks, spinning, drinks.length, bites.length]);

  function nextPicks(): [number, number] {
    if (spins === 0)
      for (const bundle of bundles) {
        const drink = drinks.findIndex((item) => bundle.ids.includes(item.id));
        const bite = bites.findIndex((item) => bundle.ids.includes(item.id));
        if (drink >= 0 && bite >= 0) return [drink, bite];
      }
    const other = (count: number, current: number) =>
      count < 2
        ? current
        : (current + 1 + Math.floor(Math.random() * (count - 1))) % count;
    return [other(drinks.length, picks[0]), other(bites.length, picks[1])];
  }

  function pullLever() {
    const arm = lever.current;
    if (!arm || paused || calm()) return;
    gsap
      .timeline()
      .to(arm, { rotationX: 150, duration: 0.24, ease: "power2.in" })
      .to(arm, { rotationX: 0, duration: 1.2, ease: "elastic.out(1, 0.4)" });
  }

  function spin() {
    if (spinning) return;
    const target = nextPicks();
    setSpins((count) => count + 1);
    pullLever();
    const reels = [drinkStrip.current, biteStrip.current];
    if (paused || calm() || !reels[0] || !reels[1]) {
      setPicks(target);
      return;
    }
    setSpinning(true);
    const timeline = gsap.timeline({
      onComplete: () => {
        setPicks(target);
        setSpinning(false);
      },
    });
    reels.forEach((strip, reel) => {
      if (!strip) return;
      const count = reel ? bites.length : drinks.length;
      const face = (strip.firstElementChild as HTMLElement).offsetHeight;
      const wrap = wrapper(strip, count);
      const setY = gsap.quickSetter(strip, "y", "px");
      // A plain number carries the whole distance; the strip shows it wrapped.
      const travel = { y: restY(strip, count, picks[reel]) };
      const show = () => setY(wrap(travel.y));
      // The second reel turns once more, so it stops after the first.
      const steps =
        (2 + reel) * count + ((target[reel] - picks[reel] + count) % count);
      const to = travel.y - steps * face;
      const duration = 1.4 + reel * 0.5;
      timeline
        .to(
          travel,
          { y: to - face * 0.12, duration, ease: "power3.out", onUpdate: show },
          0,
        )
        .to(
          travel,
          { y: to, duration: 0.3, ease: "power2.out", onUpdate: show },
          duration,
        )
        // Motion blur on the small window, never the long strip.
        .to(
          strip.parentElement,
          {
            keyframes: {
              filter: ["blur(0px)", "blur(4px)", "blur(3px)", "blur(0px)"],
            },
            duration,
            ease: "none",
          },
          0,
        );
    });
  }

  function step(reel: 0 | 1, delta: 1 | -1) {
    if (spinning) return;
    const count = reel ? bites.length : drinks.length;
    const target = (((picks[reel] + delta) % count) + count) % count;
    const next: [number, number] = reel
      ? [picks[0], target]
      : [target, picks[1]];
    const strip = reel ? biteStrip.current : drinkStrip.current;
    if (!strip || paused || calm()) {
      setPicks(next);
      return;
    }
    const face = (strip.firstElementChild as HTMLElement).offsetHeight;
    setSpinning(true);
    gsap.to(strip, {
      y: restY(strip, count, picks[reel]) - delta * face,
      duration: 0.4,
      ease: "power3.out",
      onComplete: () => {
        setPicks(next);
        setSpinning(false);
      },
    });
  }

  const drink = drinks[picks[0]];
  const bite = bites[picks[1]];
  const drinkPrice = priceOf(drink);
  const bitePrice = priceOf(bite);
  const total =
    drinkPrice !== null && bitePrice !== null ? drinkPrice + bitePrice : null;
  const bundle = bundles.find(
    (item) => item.ids.includes(drink.id) && item.ids.includes(bite.id),
  );

  return (
    <div className={s.machine} data-spinning={spinning || undefined}>
      <div className={s.sign}>
        <Lights />
        <span className={s.signText}>perfect match</span>
        <Lights bottom />
      </div>
      <div className={s.reels}>
        <Reel
          label="Drink"
          items={drinks}
          index={picks[0]}
          strip={drinkStrip}
          busy={spinning}
          onStep={(delta) => step(0, delta)}
        />
        <span className={s.join} aria-hidden="true">
          &amp;
        </span>
        <Reel
          label="Bite"
          items={bites}
          index={picks[1]}
          strip={biteStrip}
          busy={spinning}
          onStep={(delta) => step(1, delta)}
        />
      </div>
      <div className={s.result} aria-live="polite">
        <p className={s.resultKicker}>
          {spins ? "Your match" : "Today’s pairing"}
        </p>
        <p className={s.resultNames}>
          <button type="button" onClick={() => openMenu("product", drink)}>
            {drink.name}
          </button>
          <span aria-hidden="true"> &amp; </span>
          <span className="sr-only"> and </span>
          <button type="button" onClick={() => openMenu("product", bite)}>
            {bite.name}
          </button>
        </p>
        <p className={s.resultPrice}>
          {bundle ? (
            <>
              <strong>
                {formatPrice(bundle.price)} {currency}
              </strong>
              <s>
                <span className="sr-only">instead of </span>
                {formatPrice(bundle.regular)} {currency}
              </s>
              <span className={s.deal}>
                {bundle.title} bundle · save{" "}
                {formatPrice(bundle.regular - bundle.price)} {currency}
              </span>
            </>
          ) : total !== null ? (
            <>
              Together{" "}
              <strong>
                {formatPrice(total)} {currency}
              </strong>
            </>
          ) : (
            "Ask our team for today’s prices"
          )}
        </p>
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className={s.spin}
          onClick={spin}
          aria-disabled={spinning}
        >
          <Shuffle size={18} strokeWidth={1.8} />
          {spins ? "Spin again" : "Spin for my match"}
        </button>
        <p className={s.note}>Order your match at the counter.</p>
      </div>
      {/* The lever repeats the spin button for mouse and touch. */}
      <button
        type="button"
        className={s.lever}
        onClick={spin}
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className={s.leverArm} ref={lever}>
          <span className={s.leverKnob} />
        </span>
        <span className={s.leverBase} />
      </button>
    </div>
  );
}

function Lights({ bottom = false }: { bottom?: boolean }) {
  return (
    <span className={s.lights} data-bottom={bottom || undefined} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <i key={index} style={{ "--i": index } as CSSProperties} />
      ))}
    </span>
  );
}

function Reel({
  label,
  items,
  index,
  strip,
  busy,
  onStep,
}: {
  label: string;
  items: MenuProduct[];
  index: number;
  strip: RefObject<HTMLDivElement | null>;
  busy: boolean;
  onStep: (delta: 1 | -1) => void;
}) {
  const noun = label.toLowerCase();
  return (
    <div className={s.reel} role="group" aria-label={`${label} reel`}>
      <button
        type="button"
        className={s.step}
        onClick={() => onStep(-1)}
        aria-disabled={busy}
        aria-label={`Previous ${noun}`}
      >
        <ChevronUp size={18} />
      </button>
      <div className={s.window} aria-hidden="true">
        <div className={s.strip} ref={strip}>
          {Array.from({ length: LOOPS }, (_, loop) =>
            items.map((item) => <Face key={`${loop}-${item.id}`} product={item} />),
          )}
        </div>
      </div>
      <p className="sr-only">
        {label}: {items[index].name}
      </p>
      <button
        type="button"
        className={s.step}
        onClick={() => onStep(1)}
        aria-disabled={busy}
        aria-label={`Next ${noun}`}
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );
}

function Face({ product }: { product: MenuProduct }) {
  const Icon = categoryIconComponents[product.categoryIcon];
  const price = priceOf(product);
  return (
    <div className={s.face}>
      <span className={s.facePhoto}>
        {product.image ? (
          <ShimmerImage
            src={product.image}
            alt=""
            fill
            sizes="128px"
            className={s.fill}
            data-fit={fit(product.image)}
          />
        ) : (
          <Icon className={s.faceIcon} strokeWidth={1} />
        )}
      </span>
      <span className={s.faceName}>{product.name}</span>
      {price !== null && (
        <span className={s.facePrice}>
          {formatPrice(price)} {currency}
        </span>
      )}
    </div>
  );
}
