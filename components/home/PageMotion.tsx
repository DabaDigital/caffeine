"use client";

import { useEffect } from "react";

export function PageMotion() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    // Dynamically loaded: page content and navigation do not depend on animation.
    async function animate() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const textTravel = window.innerWidth < 768 ? 8 : 28;
        gsap.from(".hero-image", {
          scale: 1.04,
          duration: 1.4,
          ease: "power2.out",
        });
        gsap.from(".hero-line", {
          y: 30,
          opacity: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power3.out",
        });
        gsap.from(".hero-enter", {
          y: 12,
          opacity: 0,
          stagger: 0.08,
          duration: 0.7,
          delay: 0.12,
          ease: "power2.out",
        });
        gsap.utils
          .toArray<HTMLElement>(".section-heading, .location-copy")
          .forEach((section) => {
            gsap.from(section, {
              y: 25,
              autoAlpha: 0,
              duration: 1.1,
              ease: "power2.out",
              scrollTrigger: { trigger: section, start: "top 94%", once: true },
            });
          });
        gsap.from(".product-card", {
          y: 35,
          autoAlpha: 0,
          stagger: 0.14,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".product-grid",
            start: "top 94%",
            once: true,
          },
        });
        gsap.utils.toArray<HTMLElement>(".product-image").forEach((product) => {
          gsap.fromTo(
            product,
            { y: 7 },
            {
              y: -7,
              ease: "none",
              scrollTrigger: {
                trigger: product.closest(".product-card"),
                start: "top bottom",
                end: "bottom top",
                scrub: 1.5,
              },
            },
          );
        });
        gsap.from(".story-copy > *", {
          y: 16,
          autoAlpha: 0,
          stagger: 0.07,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".story-copy",
            start: "top 88%",
            once: true,
          },
        });
        gsap.from(".story-hand, .story-place, .story-mosaic", {
          clipPath: "inset(0 0 100% 0)",
          stagger: 0.13,
          duration: 1.3,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: ".story-hand",
            start: "top 94%",
            once: true,
          },
        });
        gsap.from(".gallery-item", {
          y: 35,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".gallery-grid",
            start: "top 94%",
            once: true,
          },
        });
        gsap.utils
          .toArray<HTMLElement>(".story-place img, .location-photo img")
          .forEach((photo) => {
            gsap.fromTo(
              photo,
              { yPercent: -3 },
              {
                yPercent: 3,
                ease: "none",
                scrollTrigger: {
                  trigger: photo.parentElement,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1.8,
                },
              },
            );
          });
        // Products drift apart while oversized typography moves gently behind them.
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".product-moment",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.6,
          },
        });
        timeline
          .fromTo(
            ".moment-coffee",
            { y: 24, rotation: -2 },
            { y: -24, rotation: 2, ease: "none" },
            0,
          )
          .fromTo(
            ".moment-crepe",
            { x: 20, y: 13, rotation: 2 },
            { x: -14, y: -13, rotation: -2, ease: "none" },
            0,
          )
          .fromTo(
            ".moment-hot",
            { y: 15, rotation: -2 },
            { y: -15, rotation: 2, ease: "none" },
            0,
          )
          .fromTo(
            ".moment-type",
            { x: -textTravel },
            { x: textTravel, ease: "none" },
            0,
          )
          .fromTo(
            ".moment-texture",
            { opacity: 0.08 },
            { opacity: 0.17, ease: "none" },
            0,
          );
      });
      void document.fonts.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
      cleanup = () => media.revert();
    }
    void animate();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return null;
}
