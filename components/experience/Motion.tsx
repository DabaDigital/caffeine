"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import s from "./experience.module.css";

function nativeScrollTo(top: number, immediate = false) {
  window.scrollTo({
    top,
    behavior: immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

const MotionContext = createContext({
  paused: false,
  toggle: () => {},
  scrollTo: nativeScrollTo,
});
export const useSiteMotion = () => useContext(MotionContext);

export function MotionRoot({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const scroller = useRef<Lenis | null>(null);
  const scrollTo = useCallback((top: number, immediate = false) => {
    if (scroller.current) scroller.current.scrollTo(top, { immediate });
    else nativeScrollTo(top, immediate || paused);
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        anchors: { offset: -96 },
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        prevent: (element) => !!element.closest("dialog, [data-lenis-prevent]"),
      });
      scroller.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const syncDialog = () => {
        if (document.querySelector("dialog[open]")) lenis.stop();
        else if (lenis.isStopped) lenis.start();
      };
      const observer = new MutationObserver(syncDialog);
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["open"],
      });
      // React closes mobile navigation before this bubbles to Lenis on window.
      document.addEventListener("click", syncDialog);
      syncDialog();

      return () => {
        observer.disconnect();
        document.removeEventListener("click", syncDialog);
        gsap.ticker.remove(tick);
        lenis.destroy();
        scroller.current = null;
      };
    });
    return () => media.revert();
  }, [paused]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (paused) return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const scope = root.current;
        if (!scope) return;
        scope
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((element) => {
            gsap.from(element, {
              y: 32,
              opacity: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 92%", once: true },
            });
          });
        // Cards in a row cascade in, once.
        scope
          .querySelectorAll<HTMLElement>("[data-stagger]")
          .forEach((group) => {
            gsap.from(group.children, {
              y: 28,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.06,
              scrollTrigger: { trigger: group, start: "top 88%", once: true },
            });
          });
        // Rating bars grow to their share.
        scope
          .querySelectorAll<HTMLElement>("[data-grow]")
          .forEach((element) => {
            gsap.from(element.querySelectorAll("[data-grow-bar]"), {
              scaleX: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.07,
              scrollTrigger: { trigger: element, start: "top 85%", once: true },
            });
          });
        scope
          .querySelectorAll<HTMLElement>("[data-photo]")
          .forEach((element) => {
            gsap.fromTo(
              element.querySelector("img"),
              { scale: 1.12, yPercent: -3 },
              {
                scale: 1,
                yPercent: 3,
                ease: "none",
                scrollTrigger: {
                  trigger: element,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1,
                },
              },
            );
          });
        scope
          .querySelectorAll<HTMLElement>("[data-reading]")
          .forEach((element) => {
            gsap.from(element.querySelectorAll("span"), {
              opacity: 0.35,
              stagger: 0.15,
              ease: "none",
              scrollTrigger: {
                trigger: element,
                start: "top 83%",
                end: "bottom 55%",
                scrub: 0.6,
              },
            });
          });
      },
      root,
    );
    return () => media.revert();
  }, [paused]);

  return (
    <MotionContext.Provider
      value={{ paused, toggle: () => setPaused((value) => !value), scrollTo }}
    >
      <div ref={root} className={s.page} data-motion-paused={paused}>
        {children}
      </div>
    </MotionContext.Provider>
  );
}
