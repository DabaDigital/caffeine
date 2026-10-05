"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useSiteMotion } from "./Motion";
import { usePageShown } from "./ReviewWall";
import s from "./reviews.module.css";

export function ReviewText({ text, author }: { text: string; author: string }) {
  const id = useId();
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const { paused } = useSiteMotion();
  /** The paragraph's height just before it opened or closed. */
  const before = useRef<number | null>(null);
  const resizing = useRef(false);

  // A review closes again when its page turns away, so a long one never
  // holds the wall open behind the next page.
  const shown = usePageShown();
  const [wasShown, setWasShown] = useState(shown);
  if (shown !== wasShown) {
    setWasShown(shown);
    if (!shown) setExpanded(false);
  }

  useEffect(() => {
    const element = paragraph.current;
    if (!element || expanded) return;
    const measure = () => {
      // Mid-ease the box is not yet its clamped height.
      if (resizing.current) return;
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [expanded, text]);

  // Opening and closing ease the height instead of jumping.
  useLayoutEffect(() => {
    const element = paragraph.current;
    const start = before.current;
    before.current = null;
    if (
      !element ||
      start === null ||
      paused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const end = element.offsetHeight;
    resizing.current = true;
    const tween = gsap.fromTo(
      element,
      { height: start, overflow: "hidden" },
      {
        height: end,
        duration: 0.5,
        ease: "power3.inOut",
        clearProps: "height,overflow",
        onComplete: () => {
          resizing.current = false;
        },
      },
    );
    return () => {
      tween.revert();
      resizing.current = false;
    };
  }, [expanded, paused]);

  return (
    <div className={s.reviewText}>
      <blockquote>
        <p ref={paragraph} id={id} className={expanded ? undefined : s.clamped}>
          {text}
        </p>
      </blockquote>
      {(overflows || expanded) && (
        <button
          className={s.readMore}
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={`${expanded ? "Show less of" : "Read full"} ${author}’s review`}
          onClick={() => {
            before.current = paragraph.current?.offsetHeight ?? null;
            setExpanded((value) => !value);
          }}
        >
          {expanded ? "Show less" : "Read full review"}{" "}
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
      )}
    </div>
  );
}
