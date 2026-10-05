"use client";

import { useEffect, useId, useRef, useState } from "react";
import s from "./reviews.module.css";

export function ReviewText({ text, author }: { text: string; author: string }) {
  const id = useId();
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = paragraph.current;
    if (!element || expanded) return;
    const measure = () =>
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [expanded, text]);

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
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Read full review"}{" "}
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
      )}
    </div>
  );
}
