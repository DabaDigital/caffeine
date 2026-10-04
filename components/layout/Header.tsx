"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Instagram, Menu, X } from "lucide-react";
import { assets, navigation, social } from "@/data/brand";
import { useMenu } from "@/components/menu/MenuProvider";
import { containDialogFocus } from "@/lib/dialog";

export function Header() {
  const header = useRef<HTMLElement>(null);
  const mobile = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { openMenu } = useMenu();
  useEffect(() => {
    const sentinel = document.querySelector(".hero-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) =>
      header.current?.classList.toggle("is-scrolled", !entry.isIntersecting),
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  function closeMobile() {
    mobile.current?.close();
    setExpanded(false);
  }
  return (
    <>
      <header ref={header} className="site-header">
        <nav className="header-inner" aria-label="Main navigation">
          <div className="nav-left">
            <a href="#home" className="home-link">
              Home
            </a>
            <a href="#menu">Menu</a>
            <a href="#story">Our Story</a>
          </div>
          <a href="#home" className="brand-logo" aria-label="Caffeine home">
            <Image
              src={assets.logo}
              alt="Caffeine Coffee & Tea House"
              width={96}
              height={96}
              sizes="96px"
              loading="eager"
            />
          </a>
          <div className="nav-right">
            <a href="#location">Location</a>
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
              aria-label="Caffeine on Instagram"
            >
              <Instagram size={18} strokeWidth={1.5} />
            </a>
            <button
              className="button button-small"
              onClick={() => openMenu("order")}
            >
              Order now <ArrowRight size={16} />
            </button>
          </div>
          <button
            className="mobile-toggle icon-button"
            aria-label="Open navigation"
            aria-expanded={expanded}
            aria-controls="mobile-navigation"
            onClick={() => {
              mobile.current?.showModal();
              setExpanded(true);
            }}
          >
            <Menu size={24} />
          </button>
        </nav>
      </header>
      <dialog
        ref={mobile}
        id="mobile-navigation"
        onKeyDown={containDialogFocus}
        aria-label="Navigation"
        className="mobile-navigation"
        onClose={() => setExpanded(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMobile();
        }}
      >
        <div className="mobile-nav-content">
          <button
            autoFocus
            className="icon-button close-button"
            aria-label="Close navigation"
            onClick={closeMobile}
          >
            <X />
          </button>
          <Image src={assets.logo} alt="Caffeine" width={90} height={90} />
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMobile}>
                {item.label}
                <ArrowRight size={22} />
              </a>
            ))}
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobile}
            >
              Instagram
              <Instagram size={22} />
            </a>
          </nav>
          <p>Good coffee. Sweet moments.</p>
        </div>
      </dialog>
    </>
  );
}
