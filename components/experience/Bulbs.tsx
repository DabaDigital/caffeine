"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSiteMotion } from "./Motion";
import s from "./menu-browser.module.css";

// Edison bulbs on rope, as above the counter. Positions keep clear of the
// section title on the left.
const bulbs = [
  { x: "52%", cord: 96, scale: 0.8, mobile: false },
  { x: "68%", cord: 150, scale: 1, mobile: true },
  { x: "83%", cord: 72, scale: 0.72, mobile: false },
  { x: "94%", cord: 118, scale: 0.9, mobile: true },
];

/**
 * Decorative bulbs that light up when the menu arrives and swing with the
 * speed of the scroll, settling like pendulums.
 */
export function Bulbs() {
  const root = useRef<HTMLDivElement>(null);
  const { paused } = useSiteMotion();

  useEffect(() => {
    const element = root.current;
    if (!element || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lamps = gsap.utils.toArray<HTMLElement>("[data-bulb]", element);
      const swing = lamps.map((lamp) =>
        gsap.quickTo(lamp, "rotation", {
          duration: 2.4,
          ease: "elastic.out(1, 0.18)",
        }),
      );
      // Each bulb flickers on, one after another.
      const glows = gsap.utils.toArray<HTMLElement>("[data-glow]", element);
      gsap.set(glows, { opacity: 0 });
      gsap.to(glows, {
        keyframes: { opacity: [0, 0.85, 0.2, 1, 0.55, 1] },
        duration: 1,
        stagger: 0.25,
        ease: "none",
        scrollTrigger: { trigger: element, start: "top 85%", once: true },
      });
      const settle = gsap.delayedCall(0.18, () => swing.forEach((to) => to(0)));
      settle.pause();
      ScrollTrigger.create({
        trigger: element.parentElement,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          // Scrolling down tips the bulbs back, as if the room moved.
          const lean = gsap.utils.clamp(-14, 14, self.getVelocity() / -260);
          swing.forEach((to, index) => to(lean * (0.75 + index * 0.12)));
          settle.restart(true);
        },
      });
    });
    return () => media.revert();
  }, [paused]);

  return (
    <div ref={root} className={s.bulbs} aria-hidden="true">
      {bulbs.map((bulb) => (
        <span
          key={bulb.x}
          className={s.bulb}
          data-bulb
          data-mobile={bulb.mobile || undefined}
          style={
            {
              "--x": bulb.x,
              "--cord": `${bulb.cord}px`,
              "--scale": bulb.scale,
            } as CSSProperties
          }
        >
          <span className={s.cord} />
          <span className={s.socket} />
          <span className={s.glass}>
            <svg viewBox="0 0 40 52" className={s.filament}>
              <path d="M14 8 L14 22 Q20 34 26 22 L26 8" />
              <path d="M16 22 Q20 28 24 22" />
            </svg>
          </span>
          <span className={s.glow} data-glow />
        </span>
      ))}
    </div>
  );
}
