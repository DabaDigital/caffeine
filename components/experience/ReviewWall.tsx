"use client";

import {
  Children,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { useSiteMotion } from "./Motion";
import { Pager } from "./Pager";
import s from "./reviews.module.css";

const PER_PAGE = 4;

/**
 * Review cards, four to a page. Every page stays in the HTML; only the
 * current one is shown.
 */
export function ReviewWall({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children);
  const pages = Array.from(
    { length: Math.ceil(cards.length / PER_PAGE) },
    (_, index) => cards.slice(index * PER_PAGE, (index + 1) * PER_PAGE),
  );
  const [page, setPage] = useState(0);
  const wall = useRef<HTMLDivElement>(null);
  const turned = useRef(false);
  const { paused } = useSiteMotion();

  useLayoutEffect(() => {
    if (!turned.current) return;
    turned.current = false;
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    gsap.fromTo(
      wall.current?.querySelectorAll('[data-current="true"] > li') ?? [],
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
        clearProps: "opacity,transform",
      },
    );
  }, [page, paused]);

  return (
    <div className={s.wallRegion} ref={wall}>
      {pages.map((group, index) => (
        <ul
          key={index}
          className={s.wall}
          hidden={index !== page}
          data-current={index === page ? "true" : undefined}
          data-stagger={index === 0 ? "" : undefined}
        >
          {group}
        </ul>
      ))}
      <Pager
        className={s.pager}
        label="Review pages"
        count={pages.length}
        page={page}
        onPage={(next) => {
          turned.current = true;
          setPage(next);
        }}
      />
    </div>
  );
}
