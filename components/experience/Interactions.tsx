"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Coffee,
  Menu,
  MapPin,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";
import { gsap } from "gsap";
import { assets } from "@/data/brand";
import { useMenu, type DialogProduct } from "@/components/menu/MenuProvider";
import { containDialogFocus } from "@/lib/dialog";
import { useSiteMotion } from "./Motion";
import s from "./experience.module.css";

const links = [
  { name: "Home", id: "home" },
  { name: "Our Menu", id: "menu" },
  { name: "Our Story", id: "story" },
  { name: "Reviews", id: "reviews" },
  { name: "Locations", id: "location" },
];

export function ExperienceHeader() {
  const { openMenu } = useMenu();
  const { paused, toggle } = useSiteMotion();
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const target = document.querySelector("#home");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: "-100px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  function close() {
    dialog.current?.close();
    setExpanded(false);
  }
  return (
    <>
      <header className={`${s.header} ${scrolled ? s.headerScrolled : ""}`}>
        <nav className={s.headerInner} aria-label="Main navigation">
          <a href="#home" className={s.brand} aria-label="Caffeine home">
            <Image
              src={assets.mark}
              alt="Caffeine Coffee & Tea House"
              width={66}
              height={66}
              loading="eager"
            />
            <span>
              Caffeine<span>COFFEE & TEA HOUSE</span>
            </span>
          </a>
          <div className={s.navLinks}>
            {links.map(({ name, id }) => (
              <a key={id} href={`#${id}`}>
                {name}
              </a>
            ))}
          </div>
          <div className={s.headerActions}>
            <button
              className={`${s.iconButton} ${s.motionButton}`}
              onClick={toggle}
              aria-label={paused ? "Play animations" : "Pause animations"}
              title={paused ? "Play animations" : "Pause animations"}
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}
            </button>
            <button
              className={s.iconButton}
              onClick={() => openMenu()}
              aria-label="Search menu"
            >
              <Search size={19} />
            </button>
            <a className={`${s.button} ${s.headerVisit}`} href="#location">
              Find your moment <ArrowUpRight size={17} />
            </a>
            <button
              className={`${s.iconButton} ${s.mobileToggle}`}
              aria-label="Open navigation"
              aria-expanded={expanded}
              aria-controls="mobile-navigation"
              onClick={() => {
                dialog.current?.showModal();
                setExpanded(true);
              }}
            >
              <Menu size={23} />
            </button>
          </div>
        </nav>
      </header>
      <dialog
        ref={dialog}
        id="mobile-navigation"
        className={s.navDialog}
        aria-label="Navigation"
        onKeyDown={containDialogFocus}
        onClose={() => setExpanded(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={s.navDialogInner}>
          <div className={s.navDialogTop}>
            <Image src={assets.mark} alt="Caffeine" width={70} height={70} />
            <button
              autoFocus
              className={s.iconButton}
              onClick={close}
              aria-label="Close navigation"
            >
              <X />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {links.map(({ name, id }) => (
              <a key={id} href={`#${id}`} onClick={close}>
                {name}
                <ArrowUpRight size={25} />
              </a>
            ))}
          </nav>
          <p>Good coffee. Great company.</p>
        </div>
      </dialog>
    </>
  );
}

export function Tilt({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { paused } = useSiteMotion();
  useEffect(() => {
    if (paused || !ref.current) return;
    const element = ref.current;
    const media = gsap.matchMedia();
    media.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const x = gsap.quickTo(element, "rotationX", {
          duration: 0.7,
          ease: "power3.out",
        });
        const y = gsap.quickTo(element, "rotationY", {
          duration: 0.7,
          ease: "power3.out",
        });
        const move = (event: globalThis.PointerEvent) => {
          const box = element.getBoundingClientRect();
          x(-((event.clientY - box.top) / box.height - 0.5) * 12);
          y(((event.clientX - box.left) / box.width - 0.5) * 14);
        };
        const reset = () => {
          x(0);
          y(0);
        };
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", reset);
        return () => {
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", reset);
        };
      },
    );
    return () => media.revert();
  }, [paused]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function MobileDock() {
  const { openMenu } = useMenu();
  return (
    <nav className={s.mobileDock} aria-label="Quick navigation">
      <a href="#menu">
        <Coffee size={17} /> Menu
      </a>
      <button onClick={() => openMenu()}>
        <Search size={16} /> Discover
      </button>
      <a href="#location">
        <MapPin size={16} /> Visit us
      </a>
    </nav>
  );
}
export function MenuAction({
  children,
  className,
  product,
}: {
  children: ReactNode;
  className?: string;
  product?: DialogProduct;
}) {
  const { openMenu } = useMenu();
  return (
    <button
      className={className}
      onClick={() => openMenu(product ? "product" : "menu", product)}
    >
      {children}
    </button>
  );
}

export function StoryAction() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className={s.textButton}
        onClick={() => dialog.current?.showModal()}
      >
        Discover Our Story <ArrowUpRight size={19} />
      </button>
      <dialog
        ref={dialog}
        className={s.storyDialog}
        onKeyDown={containDialogFocus}
        aria-labelledby="our-story-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div>
          <button
            autoFocus
            className={`${s.iconButton} ${s.storyClose}`}
            aria-label="Close story"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
          <Image src={assets.mark} alt="" width={48} height={47} />
          <h2 id="our-story-title">A little place for the good moments.</h2>
          <p>
            Good coffee, irresistible crêpes, and the people you share them
            with. That’s what Caffeine is about.
          </p>
          <p>
            In the heart of Maarif, our Coffee & Tea House is a place to slow
            down. Drop in for your morning ritual, take an afternoon break, or
            stay a little longer with friends.
          </p>
          <a
            href="#location"
            className={s.button}
            onClick={() => dialog.current?.close()}
          >
            Come say hello <ArrowUpRight size={18} />
          </a>
        </div>
      </dialog>
    </>
  );
}
