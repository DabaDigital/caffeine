"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUpRight, Menu, Pause, Play, X } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { animate } from "animejs";
import { useMenu } from "@/components/menu/MenuProvider";
import s from "./brew.module.css";
import "lenis/dist/lenis.css";

const CoffeeObject = dynamic(() => import("./CoffeeObject"), { ssr: false });
const MotionContext = createContext({ paused: false, toggle: () => {} });

export function BrewMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        duration: 1.05,
        anchors: { offset: -88 },
        prevent: (el) => !!el.closest("dialog, [data-lenis-prevent]"),
      });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      const context = gsap.context(() => {
        gsap.from("[data-hero-line]", {
          yPercent: 105,
          rotate: 2,
          stagger: 0.09,
          duration: 1.05,
          ease: "power4.out",
          clearProps: "transform",
        });
        gsap.from("[data-hero-detail]", {
          y: 18,
          opacity: 0,
          duration: 0.8,
          delay: 0.25,
          stagger: 0.07,
          clearProps: "all",
        });
        gsap.to("[data-hero-cup]", {
          yPercent: 14,
          rotate: 10,
          ease: "none",
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
        gsap.to("[data-bean]", {
          y: -95,
          rotate: 45,
          stagger: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
        gsap.to("[data-brew-ticker]", {
          xPercent: -50,
          duration: 36,
          repeat: -1,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-brew-ticker]",
            toggleActions: "play pause play pause",
          },
        });
        root.current
          ?.querySelectorAll<HTMLElement>("[data-brew-reveal]")
          .forEach((el) =>
            gsap.from(el, {
              y: 35,
              opacity: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 95%", once: true },
              clearProps: "all",
            }),
          );
        root.current
          ?.querySelectorAll<HTMLElement>("[data-brew-photo]")
          .forEach((el) =>
            gsap.fromTo(
              el.querySelector("img"),
              { scale: 1.12 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            ),
          );
      }, root);
      const observer = new MutationObserver(() => {
        if (root.current?.querySelector("dialog[open]")) lenis.stop();
        else lenis.start();
      });
      root.current
        ?.querySelectorAll("dialog")
        .forEach((dialog) =>
          observer.observe(dialog, {
            attributes: true,
            attributeFilter: ["open"],
          }),
        );
      let active = true;
      document.fonts.ready.then(() => {
        if (active) ScrollTrigger.refresh();
      });
      return () => {
        active = false;
        observer.disconnect();
        context.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });
    return () => media.revert();
  }, [paused]);
  return (
    <MotionContext.Provider
      value={{ paused, toggle: () => setPaused((v) => !v) }}
    >
      <div
        ref={root}
        className={s.root}
        data-motion={paused ? "paused" : "playing"}
      >
        {children}
      </div>
    </MotionContext.Provider>
  );
}

export function MenuButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { openMenu } = useMenu();
  return (
    <button className={className} onClick={() => openMenu("menu")}>
      {children}
    </button>
  );
}

export function BrewHeader({ delivery }: { delivery: string }) {
  const { paused, toggle } = useContext(MotionContext);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  return (
    <header className={s.header}>
      <a href="#home" className={s.brand} aria-label="Caffeine home">
        <Image src="/assets/brand-mark.png" width={43} height={43} alt="" />
        <span>
          Caffeine<small>COFFEE & TEA HOUSE</small>
        </span>
      </a>
      <nav aria-label="Main navigation" className={s.desktopNav}>
        <a href="#menu">THE MENU</a>
        <a href="#story">THE FEELING</a>
        <a href="#location">
          FIND US <ArrowUpRight size={13} />
        </a>
      </nav>
      <div className={s.headerActions}>
        <button
          className={s.motionButton}
          onClick={toggle}
          aria-label={paused ? "Resume animations" : "Pause animations"}
          aria-pressed={paused}
          title={paused ? "Resume animations" : "Pause animations"}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <a
          className={s.orderButton}
          href={delivery}
          target="_blank"
          rel="noopener noreferrer"
        >
          GET YOUR FIX{" "}
          <span>
            <ArrowUpRight size={17} />
          </span>
        </a>
        <button
          ref={toggleRef}
          className={s.navToggle}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="brew-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="brew-navigation"
          className={s.mobileNav}
          aria-label="Mobile navigation"
        >
          <a onClick={() => setOpen(false)} href="#menu">
            The menu <ArrowUpRight />
          </a>
          <a onClick={() => setOpen(false)} href="#story">
            The feeling <ArrowUpRight />
          </a>
          <a onClick={() => setOpen(false)} href="#location">
            Find us <ArrowUpRight />
          </a>
        </nav>
      )}
    </header>
  );
}

export function BrewHero({ place }: { place: string }) {
  const [iced, setIced] = useState(false);
  const product = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { paused } = useContext(MotionContext);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const animation = animate(product.current!, {
      translateY: [24, 0],
      rotate: [iced ? 8 : -8, 0],
      opacity: [0.45, 1],
      duration: 620,
      ease: "out(4)",
    });
    return () => { animation.revert(); };
  }, [iced, paused]);
  useEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", () => {
      const el = stage.current!;
      const x = gsap.quickTo(el, "rotationY", {
        duration: 0.8,
        ease: "power3.out",
      });
      const y = gsap.quickTo(el, "rotationX", {
        duration: 0.8,
        ease: "power3.out",
      });
      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        x(((event.clientX - rect.left) / rect.width - 0.5) * 13);
        y(-((event.clientY - rect.top) / rect.height - 0.5) * 10);
      };
      const leave = () => {
        x(0);
        y(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { clearProps: "transform" });
      };
    });
    return () => mm.revert();
  }, [paused]);
  return (
    <section id="home" className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroMeta}>
        <span>
          <i className={s.statusDot} /> A LITTLE ESCAPE. A LOT OF CAFFEINE.
        </span>
        <span>
          {place.toUpperCase()} <ArrowUpRight size={13} />
        </span>
      </div>
      <div className={s.heroComposition}>
        <div className={s.heroCopy}>
          <p className={s.heroEyebrow} data-hero-detail>
            GOOD COFFEE. GREAT COMPANY.
          </p>
          <h1
            id="hero-title"
            className={s.heroTitle}
            aria-label="Your daily dose of good."
          >
            <span>
              <span data-hero-line>YOUR DAILY</span>
            </span>
            <span>
              <span data-hero-line>DOSE OF</span>
            </span>
            <span className={s.serifLine}>
              <em data-hero-line>good.</em>
              <span className={s.titleAsterisk} aria-hidden="true">
                ✳
              </span>
            </span>
          </h1>
          <p className={s.heroDescription} data-hero-detail>
            Bold coffee. Irresistible crêpes.
            <br />
            Your favourite pause in the heart of Maarif.
          </p>
          <div className={s.heroCtas} data-hero-detail>
            <a href="#menu" className={s.solidButton}>
              Explore the menu{" "}
              <span>
                <ArrowUpRight size={20} />
              </span>
            </a>
            <a href="#story" className={s.heroTextLink}>
              Step inside <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div className={s.cupStage} ref={stage}>
          <div className={s.goldDisc} aria-hidden="true">
            <Image src="/assets/brand-mark.png" fill sizes="40vw" alt="" />
          </div>
          <div className={s.orbit} aria-hidden="true">
            <span>COFFEE & TEA HOUSE</span>
            <i />
            <b>EST. MAARIF</b>
          </div>
          <div className={s.heroCup} data-hero-cup>
            <div ref={product} className={s.cupImage}>
              <Image
                src={
                  iced
                    ? "/assets/opening-iced.webp"
                    : "/assets/opening-hot.webp"
                }
                alt={
                  iced
                    ? "Caffeine iced caramel coffee with ice and coffee beans"
                    : "Caffeine black takeaway coffee cup with its gold emblem"
                }
                fill
                sizes="(max-width: 700px) 85vw, 45vw"
                preload
              />
            </div>
          </div>
          <Image
            className={s.beanOne}
            data-bean
            src="/assets/floating-bean.webp"
            width={105}
            height={138}
            alt=""
          />
          <Image
            className={s.beanTwo}
            data-bean
            src="/assets/floating-bean.webp"
            width={65}
            height={85}
            alt=""
          />
          <div className={s.cupAnnotation} aria-hidden="true">
            <span>
              YOUR CUP.
              <br />
              YOUR KIND OF DAY.
            </span>
            <i />
          </div>
          <div
            className={s.temperature}
            role="group"
            aria-label="Choose your coffee mood"
          >
            <button aria-pressed={!iced} onClick={() => setIced(false)}>
              01 / HOT
            </button>
            <button aria-pressed={iced} onClick={() => setIced(true)}>
              02 / ICED
            </button>
          </div>
        </div>
      </div>
      <div className={s.heroBottom}>
        <a href="#menu" className={s.scrollLink}>
          <span>
            <ArrowDown size={19} />
          </span>
          SCROLL TO GET
          <br />
          YOUR DAILY DOSE
        </a>
        <span className={s.heroArabic} lang="ar" dir="rtl">
          قهوتك، على ذوقك.
        </span>
        <a href="#story" className={s.heroPhoto}>
          <Image
            src="/assets/caffeine-bar.webp"
            alt="Inside Caffeine’s warm wood espresso bar"
            width={115}
            height={76}
          />
          <span>
            A CORNER OF CASABLANCA.
            <strong>
              A feeling like home. <ArrowUpRight size={16} />
            </strong>
          </span>
        </a>
      </div>
    </section>
  );
}

const ritualSteps = [
  {
    title: "THE BEAN.",
    label: "01 / THE BEGINNING",
    text: "Small bean. Big personality. This is where your daily ritual begins.",
  },
  {
    title: "THE BREW.",
    label: "02 / THE CRAFT",
    text: "The aroma. The crema. The anticipation. A little care in every single cup.",
  },
  {
    title: "THE FEELING.",
    label: "03 / YOUR MOMENT",
    text: "That first sip. A deep breath. Suddenly, the day feels a little more yours.",
  },
];

export function Ritual() {
  const { paused } = useContext(MotionContext);
  const section = useRef<HTMLElement>(null);
  const progress = useRef({ value: 0 });
  const [step, setStep] = useState(0);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    if (paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
      () => {
        const context = gsap.context(() => {
          gsap.to(progress.current, {
            value: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section.current,
              start: "top 88px",
              end: "+=1050",
              pin: true,
              scrub: 0.7,
              onUpdate: (self) =>
                setStep(Math.min(2, Math.floor(self.progress * 3))),
            },
          });
        }, section);
        return () => context.revert();
      },
    );
    return () => media.revert();
  }, [paused]);
  return (
    <section
      ref={section}
      className={s.ritual}
      id="ritual"
      aria-labelledby="ritual-title"
    >
      <div className={s.sectionMeta}>
        <span>02 / FROM BEAN TO FEELING</span>
        <span>DU GRAIN À LA TASSE</span>
      </div>
      <div className={s.ritualGrid}>
        <div className={s.ritualCopy}>
          <span className={s.mono}>
            THERE’S A LITTLE MAGIC IN THE EVERYDAY.
          </span>
          <h2 id="ritual-title">
            SMALL CUP.
            <br />
            <em>Big feeling.</em>
          </h2>
          <div
            className={s.ritualSteps}
            role="group"
            aria-label="The coffee ritual"
          >
            {ritualSteps.map((item, index) => (
              <button
                key={item.title}
                aria-pressed={step === index}
                onClick={() => {
                  setStep(index);
                  progress.current.value = index / 2;
                }}
              >
                {String(index + 1).padStart(2, "0")}
                <span>{item.title}</span>
              </button>
            ))}
          </div>
          <div className={s.ritualCaption} aria-live="polite">
            <span className={s.mono}>{ritualSteps[step].label}</span>
            <p>{ritualSteps[step].text}</p>
          </div>
          <MenuButton className={s.textLink}>
            Find your daily ritual <ArrowUpRight size={18} />
          </MenuButton>
        </div>
        <div className={s.objectColumn}>
          <div className={s.objectWrap}>
            <span className={s.objectOrbit} aria-hidden="true" />
            <CoffeeObject
              paused={paused}
              progress={progress}
              rotation={rotation}
            />
          </div>
          <label className={s.rotationControl}>
            <span>GIVE IT A SPIN</span>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              aria-label="Rotate the coffee cup"
            />
            <span aria-hidden="true">360° ↻</span>
          </label>
        </div>
      </div>
    </section>
  );
}
