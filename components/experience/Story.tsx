"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { assets } from "@/data/brand";
import { StoryAction } from "./Interactions";
import { useSiteMotion } from "./Motion";
import { ShimmerImage } from "./Skeleton";
import s from "./story.module.css";

const chapters = ["Outside", "Inside", "The ritual"];
/** Scroll progress at which each chapter is fully in view. */
const marks = [0.03, 0.52, 0.94];
/** The storefront window the walk-in zooms toward, in % of the photo. */
const door = "36% 74%";

const cards = [
  {
    src: "/assets/story-espresso-bar.png",
    alt: "A barista preparing espresso at Caffeine's warm OSB coffee bar",
    caption: "made to order, every time.",
  },
  {
    src: "/assets/story-storefront-closeup.png",
    alt: "Caffeine Cure's gold sign above the café entrance",
    caption: "your neighbourhood coffee stop.",
  },
  {
    src: "/assets/story-storefront-evening.png",
    alt: "Caffeine Cure's warmly lit storefront in the evening",
    caption: "stay all afternoon.",
  },
];

/**
 * "More than a coffee stop", told as a walk in: on wide screens the scene
 * holds still while scrolling zooms through the storefront window into the
 * café. Elsewhere, and with reduced motion, the chapters simply stack.
 */
export function Story({
  number,
  place,
}: {
  number: string;
  place: string | null;
}) {
  const root = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const { paused } = useSiteMotion();

  useEffect(() => {
    const section = root.current;
    if (!section || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)",
      () => {
        // The layout switches before measuring, so the scroll length is right.
        section.dataset.scene = "on";
        const select = gsap.utils.selector(section);
        const inside = `circle(0% at ${door})`;
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: ({ progress }) =>
                setChapter(progress < 0.33 ? 0 : progress < 0.72 ? 1 : 2),
            },
          })
          // 1. Walk up to the window.
          .fromTo(
            select("[data-outside-photo]"),
            { scale: 1, transformOrigin: door },
            { scale: 2.3, duration: 0.42 },
            0,
          )
          .to(
            select('[data-chapter="0"] [data-copy]'),
            { y: -90, opacity: 0, duration: 0.22 },
            0.08,
          )
          // 2. Through the glass: the café opens out of the window.
          .fromTo(
            select('[data-chapter="1"]'),
            { clipPath: inside },
            { clipPath: `circle(150% at ${door})`, duration: 0.3 },
            0.24,
          )
          .fromTo(
            select("[data-inside-photo]"),
            { scale: 1.35 },
            { scale: 1, duration: 0.42 },
            0.24,
          )
          .fromTo(
            select('[data-chapter="1"] [data-copy]'),
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.12 },
            0.46,
          )
          .to(
            select('[data-chapter="1"] [data-copy]'),
            { y: -60, opacity: 0, duration: 0.1 },
            0.66,
          )
          .to(select("[data-inside-shade]"), { opacity: 0.84, duration: 0.14 }, 0.64)
          // 3. The ritual: three moments come forward out of the room.
          .fromTo(
            select('[data-chapter="2"]'),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.04 },
            0.7,
          )
          .fromTo(
            select("[data-card]"),
            {
              z: -700,
              y: 90,
              opacity: 0,
              rotationY: (index: number) => [-30, 0, 30][index % 3],
            },
            {
              z: 0,
              y: 0,
              opacity: 1,
              rotationY: (index: number) => [-7, 2, 8][index % 3],
              duration: 0.2,
              stagger: 0.04,
            },
            0.72,
          )
          .fromTo(
            select('[data-chapter="2"] [data-copy]'),
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.12 },
            0.8,
          );
        ScrollTrigger.refresh();
        return () => {
          delete section.dataset.scene;
          setChapter(0);
        };
      },
    );
    return () => media.revert();
  }, [paused]);

  function jump(index: number) {
    const section = root.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const length = section.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + length * marks[index],
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <section
      id="story"
      ref={root}
      className={s.story}
      aria-labelledby="story-title"
    >
      <div className={s.stage}>
        <div className={s.chapter} data-chapter="0">
          <div className={s.photo} data-outside-photo>
            <ShimmerImage
              src="/assets/story-storefront-evening.png"
              alt="The Caffeine storefront at dusk: black façade, gold sign and lit windows"
              fill
              sizes="100vw"
              quality={85}
              className={s.fill}
            />
          </div>
          <div className={s.scrim} />
          <div className={s.copy} data-copy>
            <p className={s.eyebrow}>{number} — MORE THAN A COFFEE STOP</p>
            <h2 id="story-title" className={s.title}>
              Less rush. <span className="sr-only">More ritual.</span>
            </h2>
            <p className={s.lede}>
              <em>Du grain à la tasse.</em> From the bean to your cup
              {place ? `, right here in ${place}` : ""}.
            </p>
          </div>
        </div>

        <div className={s.chapter} data-chapter="1">
          <div className={s.photo} data-inside-photo>
            <ShimmerImage
              src="/assets/story-espresso-bar.png"
              alt="Inside Caffeine: OSB walls, Edison bulbs and the coffee bar"
              fill
              sizes="100vw"
              quality={85}
              className={s.fill}
            />
          </div>
          <div className={s.scrim} />
          <div className={s.shade} data-inside-shade />
          <div className={s.copy} data-copy>
            <p className={s.title} aria-hidden="true">
              <em>More ritual.</em>
            </p>
            <p className={s.lede}>
              That first sip. The extra bite. The conversation that turns into
              another coffee.
            </p>
          </div>
        </div>

        <div className={s.chapter} data-chapter="2">
          <ul className={s.cards}>
            {cards.map((card) => (
              <li key={card.src} className={s.card} data-card>
                <ShimmerImage
                  src={card.src}
                  alt={card.alt}
                  fill
                  sizes="(max-width: 899px) 70vw, 22vw"
                  quality={85}
                  className={s.cardPhoto}
                />
                <p>{card.caption}</p>
              </li>
            ))}
          </ul>
          <div className={s.ritual} data-copy>
            <p className={s.lede}>
              In the heart of Maarif, we’re making room for the good things.
              Proper coffee, generously filled crêpes, and a seat that feels
              like yours. Stay five minutes. Stay all afternoon.
            </p>
            <StoryAction />
            <p className={s.signoff}>
              <Image src={assets.mark} alt="" width={39} height={39} />
              <span>See you at Caffeine.</span>
            </p>
          </div>
        </div>

        <nav className={s.dots} aria-label="Story chapters">
          {chapters.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-current={chapter === index ? "step" : undefined}
              onClick={() => jump(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
