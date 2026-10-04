"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Instagram, Menu, Search, X } from "lucide-react";
import { useMenu } from "@/components/menu/MenuProvider";
import { social } from "@/data/brand";
import type { Product } from "@/data/menu";
import { containDialogFocus } from "@/lib/dialog";
import { Brand } from "./Brand";
import styles from "./page.module.css";

const links = [
  { name: "Home", id: "home" },
  { name: "Our Menu", id: "menu" },
  { name: "Our Story", id: "story" },
  { name: "Locations", id: "location" },
];

export function DesignHeader() {
  const { openMenu } = useMenu();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const mobile = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const current = links.findLast(({ id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 180;
      });
      if (current) setActive(current.id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function closeNavigation() {
    mobile.current?.close();
    setExpanded(false);
  }

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <nav className={styles.headerInner} aria-label="Main navigation">
          <Brand />
          <div className={styles.navLinks}>
            {links.map(({ name, id }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
              >
                {name}
              </a>
            ))}
          </div>
          <div className={styles.headerActions}>
            <a
              className={styles.iconButton}
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Caffeine on Instagram"
            >
              <Instagram size={20} strokeWidth={1.7} />
            </a>
            <button
              className={styles.iconButton}
              onClick={() => openMenu()}
              aria-label="Search menu"
            >
              <Search size={21} strokeWidth={1.7} />
            </button>
            <button
              className={`${styles.button} ${styles.orderButton}`}
              onClick={() => openMenu("order")}
            >
              Order Now <ArrowRight size={17} />
            </button>
            <button
              className={`${styles.iconButton} ${styles.mobileToggle}`}
              aria-label="Open navigation"
              aria-controls="design-navigation"
              aria-expanded={expanded}
              onClick={() => {
                mobile.current?.showModal();
                setExpanded(true);
              }}
            >
              <Menu size={25} />
            </button>
          </div>
        </nav>
      </header>
      <dialog
        ref={mobile}
        id="design-navigation"
        className={styles.mobileDialog}
        aria-label="Navigation"
        onKeyDown={containDialogFocus}
        onClose={() => setExpanded(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeNavigation();
        }}
      >
        <div className={styles.mobileDialogInner}>
          <button
            autoFocus
            className={styles.closeButton}
            aria-label="Close navigation"
            onClick={closeNavigation}
          >
            <X />
          </button>
          <Brand />
          <nav aria-label="Mobile navigation">
            {links.map(({ name, id }) => (
              <a key={id} href={`#${id}`} onClick={closeNavigation}>
                {name}
                <ArrowRight size={22} />
              </a>
            ))}
          </nav>
          <p className={styles.handwriting}>Good coffee. Sweet moments.</p>
        </div>
      </dialog>
    </>
  );
}

export function MenuAction({
  children,
  className,
  product,
  label,
}: {
  children: ReactNode;
  className?: string;
  product?: Product;
  label?: string;
}) {
  const { openMenu } = useMenu();
  return (
    <button
      className={className}
      aria-label={label}
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
        className={styles.button}
        onClick={() => dialog.current?.showModal()}
      >
        Discover Our Story <ArrowRight size={17} />
      </button>
      <dialog
        ref={dialog}
        className={styles.storyDialog}
        aria-labelledby="our-story-title"
        onKeyDown={containDialogFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className={styles.storyDialogInner}>
          <button
            autoFocus
            className={styles.closeButton}
            aria-label="Close story"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
          <p className={styles.eyebrow}>OUR STORY</p>
          <h2 id="our-story-title">
            A little place for
            <br />
            the good moments.
          </h2>
          <p>
            Good coffee, irresistible crêpes, and the people you share them
            with. That’s what Caffeine is about.
          </p>
          <p>
            In the heart of Maarif, our Coffee & Tea House is a place to slow
            down. Drop in for your morning ritual, take an afternoon break, or
            stay a little longer with friends.
          </p>
          <p className={styles.handwriting}>Same people. Bigger moments.</p>
          <a
            className={styles.button}
            href="#location"
            onClick={() => dialog.current?.close()}
          >
            Come say hello <ArrowRight size={17} />
          </a>
        </div>
      </dialog>
    </>
  );
}
