"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight, RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CoffeeScene } from "./CoffeeScene";
import { useSiteMotion } from "./Motion";
import s from "./opening.module.css";

/** A short brand entrance, then a two-scene film controlled by native scroll. */
export function HeroOpening({ place }: { place: string | null }) {
  const root = useRef<HTMLElement>(null);
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const hasEntered = useRef(false);
  const { paused } = useSiteMotion();

  useLayoutEffect(() => {
    const section = root.current;
    if (!section || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 900px) and (min-height: 600px)",
        pointer: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        if (!context.conditions?.motion) return;
        const desktop = context.conditions.desktop;
        const select = gsap.utils.selector(section);
        const stage = section.querySelector<HTMLElement>(
          "[data-opening-stage]",
        )!;
        const portrait =
          section.querySelector<HTMLElement>("[data-cup-pointer]")!;
        const progress = { value: 0 };

        // Separate wrappers own entry, float, pointer and scroll transforms.
        // This keeps each motion interruptible without fighting another tween.
        const float = gsap.to(select("[data-cup-float]"), {
          y: -12,
          rotation: 2,
          duration: 3.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
        const orbit = gsap.to(select("[data-orbit]"), {
          rotation: 360,
          duration: 75,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%",
        });

        // The film is short on touch screens, with no wheel/touch interception.
        const film = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "caffeine-opening",
            trigger: section,
            pin: stage,
            start: "top top",
            end: () => `+=${stage.offsetHeight * (desktop ? 1.35 : 0.8)}`,
            scrub: 0.65,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (self.progress > 0.01 && entrance.current?.isActive())
                entrance.current.progress(1);
            },
          },
        });
        film
          .to(
            select("[data-wake]"),
            { xPercent: -30, yPercent: -35, opacity: 0, duration: 0.36 },
            0,
          )
          .to(
            select("[data-senses]"),
            { xPercent: 25, yPercent: 25, opacity: 0, duration: 0.36 },
            0,
          )
          .to(
            select("[data-first-copy]"),
            { y: -25, autoAlpha: 0, duration: 0.22 },
            0,
          )
          .fromTo(
            select("[data-night]"),
            { clipPath: "circle(0% at 50% 50%)" },
            { clipPath: "circle(100% at 50% 50%)", duration: 0.62 },
            0.03,
          )
          .to(
            select("[data-orbit-wrap]"),
            { scale: 1.4, opacity: 0, duration: 0.4 },
            0,
          )
          .to(
            select("[data-iced-travel]"),
            {
              x: () => -stage.offsetWidth * (desktop ? 0.255 : 0.22),
              y: () => stage.offsetHeight * (desktop ? 0.02 : 0.05),
              rotation: -17,
              scale: desktop ? 0.8 : 0.62,
              duration: 0.72,
            },
            0,
          )
          .fromTo(
            select("[data-hot-travel]"),
            {
              x: () => stage.offsetWidth * 0.6,
              y: () => stage.offsetHeight * 0.65,
              rotation: 35,
              scale: 0.9,
              autoAlpha: 0,
            },
            {
              x: () => stage.offsetWidth * (desktop ? 0.26 : 0.23),
              y: () => stage.offsetHeight * (desktop ? 0.01 : 0.045),
              rotation: 13,
              scale: desktop ? 0.74 : 0.62,
              autoAlpha: 1,
              duration: 0.65,
            },
            0.2,
          )
          .fromTo(
            select("[data-second-copy]"),
            { y: 45, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.3 },
            0.48,
          )
          .to(select("[data-first-index]"), { opacity: 0, duration: 0.15 }, 0.3)
          .to(
            select("[data-second-index]"),
            { opacity: 1, duration: 0.15 },
            0.4,
          )
          .to(
            progress,
            {
              value: 1,
              duration: 1,
              onUpdate: () => {
                section.dataset.sceneProgress = String(progress.value);
              },
            },
            0,
          );

        const visibility = new IntersectionObserver(([entry]) => {
          const playing = entry.isIntersecting && !document.hidden;
          float.paused(!playing);
          orbit.paused(!playing);
        });
        visibility.observe(section);
        const onVisibility = () => {
          const box = section.getBoundingClientRect();
          const playing =
            !document.hidden && box.bottom > 0 && box.top < window.innerHeight;
          float.paused(!playing);
          orbit.paused(!playing);
        };
        document.addEventListener("visibilitychange", onVisibility);

        const intro = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out" },
        });
        entrance.current = intro;
        intro
          .set(select("[data-curtain]"), { display: "grid", yPercent: 0 })
          .fromTo(
            select("[data-curtain-word]"),
            { yPercent: 110, rotation: 5 },
            { yPercent: 0, rotation: 0, duration: 0.65 },
            0,
          )
          .to(
            select("[data-curtain-word]"),
            { yPercent: -110, rotation: -5, duration: 0.65 },
            0.65,
          )
          .to(
            select("[data-curtain]"),
            { yPercent: -102, duration: 1.05, ease: "power3.inOut" },
            0.65,
          )
          .fromTo(
            select("[data-letter]"),
            { yPercent: 115, rotationX: -65 },
            { yPercent: 0, rotationX: 0, stagger: 0.035, duration: 1.1 },
            0.83,
          )
          .fromTo(
            select("[data-cup-entry]"),
            { y: 160, rotation: 22, scale: 0.9, opacity: 0 },
            { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 1.35 },
            0.72,
          )
          .fromTo(
            select("[data-intro-detail]"),
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.07, duration: 0.8 },
            1.1,
          )
          .set(select("[data-curtain]"), { display: "none" });
        if (
          !hasEntered.current &&
          window.scrollY < 40 &&
          !window.location.hash
        ) {
          intro.play();
        } else {
          intro.progress(1);
        }
        hasEntered.current = true;

        let move: ((event: PointerEvent) => void) | undefined;
        let reset: (() => void) | undefined;
        if (context.conditions.pointer) {
          const rotateX = gsap.quickTo(portrait, "rotationX", {
            duration: 0.7,
            ease: "power3.out",
          });
          const rotateY = gsap.quickTo(portrait, "rotationY", {
            duration: 0.7,
            ease: "power3.out",
          });
          move = (event) => {
            if (event.pointerType !== "mouse") return;
            const box = stage.getBoundingClientRect();
            rotateX(-((event.clientY - box.top) / box.height - 0.5) * 12);
            rotateY(((event.clientX - box.left) / box.width - 0.5) * 16);
          };
          reset = () => {
            rotateX(0);
            rotateY(0);
          };
          stage.addEventListener("pointermove", move);
          stage.addEventListener("pointerleave", reset);
        }
        return () => {
          visibility.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          if (move) stage.removeEventListener("pointermove", move);
          if (reset) stage.removeEventListener("pointerleave", reset);
          entrance.current = null;
          delete section.dataset.sceneProgress;
          film.scrollTrigger?.kill();
        };
      },
      root,
    );
    return () => media.revert();
  }, [paused]);

  const replay = () => {
    if (!entrance.current || paused) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    ScrollTrigger.getById("caffeine-opening")?.animation?.progress(0);
    ScrollTrigger.update();
    entrance.current.restart();
  };

  return (
    <section
      ref={root}
      id="home"
      className={s.opening}
      aria-labelledby="hero-title"
      data-opening
    >
      <div className={s.stage} data-opening-stage>
        <div className={s.night} data-night aria-hidden="true" />
        <div className={s.grid} aria-hidden="true" />

        <div className={s.topline} data-first-copy>
          <p data-intro-detail>
            <span /> YOUR DAILY DOSE OF GOOD
          </p>
          <span data-intro-detail>{place ?? "COFFEE & TEA HOUSE"}</span>
        </div>

        <h1 id="hero-title" className={s.title} aria-label="Wake your senses.">
          <span className={s.wake} data-wake>
            <span className={s.word} aria-hidden="true">
              {"WAKE".split("").map((letter, i) => (
                <span key={i} data-letter>
                  {letter}
                </span>
              ))}
            </span>
            <span className={s.your} aria-hidden="true" data-intro-detail>
              your
            </span>
          </span>
          <span className={s.senses} data-senses aria-hidden="true">
            <span className={s.word}>
              {"SENSES.".split("").map((letter, i) => (
                <span key={i} data-letter>
                  {letter}
                </span>
              ))}
            </span>
          </span>
        </h1>

        <div className={s.orbitWrap} data-orbit-wrap aria-hidden="true">
          <div className={s.orbit} data-orbit>
            <span />
            <span />
          </div>
          <span className={s.orbitNote} data-intro-detail>
            A LITTLE OBSESSION. A LOT OF COFFEE.
          </span>
        </div>

        <div className={s.cupWorld}>
          <div className={s.cupShadow} data-first-copy aria-hidden="true" />
          <div className={s.icedTravel} data-iced-travel>
            <div className={s.cupEntry} data-cup-entry>
              <div className={s.cupPointer} data-cup-pointer>
                <div className={s.iced} data-cup-float>
                  <Image
                    src="/assets/opening-iced.webp"
                    alt="Caffeine iced coffee with caramel, ice and floating coffee beans"
                    fill
                    sizes="(max-width: 899px) 86vw, 42vw"
                    quality={85}
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={s.hotTravel} data-hot-travel aria-hidden="true">
            <Image
              src="/assets/opening-hot.webp"
              alt=""
              fill
              sizes="(max-width: 899px) 62vw, 32vw"
              quality={85}
            />
          </div>
          <CoffeeScene />
        </div>

        <div className={s.sideNote} data-first-copy>
          <span className={s.asterisk} data-intro-detail aria-hidden="true">
            ✳
          </span>
          <p data-intro-detail>
            Big on flavor.
            <br />
            Even bigger on
            <br />
            <em>feeling good.</em>
          </p>
        </div>

        <div className={s.firstBottom} data-first-copy>
          <div className={s.invitation} data-intro-detail>
            <p>Life’s too short for ordinary coffee.</p>
            <a href="#menu" className={s.cta}>
              Explore Menu <ArrowUpRight size={20} />
            </a>
          </div>
          <div className={s.handwritten} data-intro-detail>
            your new
            <br />
            happy habit. <ArrowUpRight size={32} strokeWidth={1} />
          </div>
        </div>

        <div className={s.secondCopy} data-second-copy>
          <p className={s.secondEyebrow}>DIFFERENT MOODS. SAME OBSESSION.</p>
          <p className={s.secondTitle}>
            Some like it <em>hot.</em>
            <br />
            Some like it <em>iced.</em>
          </p>
          <p className={s.secondDescription}>
            Your mood. Your moment. Your Caffeine.
          </p>
          <a href="#menu" className={s.secondCta}>
            Find your favorite <ArrowUpRight size={18} />
          </a>
        </div>

        <div className={s.bottomBar} data-intro-detail>
          <div className={s.chapter} aria-hidden="true">
            <span data-first-index>01 — WAKE YOUR SENSES</span>
            <span data-second-index>02 — MAKE IT YOURS</span>
          </div>
          <a className={s.scrollHint} href="#menu">
            <span>SCROLL TO FEEL IT</span>
            <ArrowDown size={15} />
          </a>
          <button
            className={s.replay}
            onClick={replay}
            aria-label="Replay opening animation"
            disabled={paused}
          >
            <RotateCcw size={13} /> REPLAY
          </button>
        </div>

        <div className={s.curtain} data-curtain aria-hidden="true">
          <div>
            <span data-curtain-word>
              Caffeine<span className={s.curtainStar}>✳</span>
            </span>
          </div>
          <p>A GOOD DAY STARTS HERE.</p>
        </div>
      </div>
    </section>
  );
}
