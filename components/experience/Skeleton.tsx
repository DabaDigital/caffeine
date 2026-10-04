"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "./skeleton.module.css";

/**
 * A lazy image over a shimmering placeholder. The photo is never hidden, so
 * it still shows without JavaScript; the shimmer stops once it has loaded.
 */
export function ShimmerImage({
  className = "",
  alt,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState<string | null>(null);
  const source = String(typeof props.src === "string" ? props.src : "");
  return (
    <span
      className={`${s.frame} ${className}`}
      data-state={loaded === source ? "done" : "loading"}
    >
      <Image
        {...props}
        alt={alt}
        onLoad={(event) => {
          setLoaded(source);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoaded(source);
          onError?.(event);
        }}
      />
    </span>
  );
}

/** A shimmering block for skeleton layouts. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span className={`${s.block} ${className}`} aria-hidden="true" />;
}

/**
 * Renders `fallback` until the spot nears the viewport, then `children`.
 * With a `next/dynamic` child, its code is only downloaded at that point.
 */
export function LazyMount({
  children,
  fallback,
  className,
  rootMargin = "700px 0px",
}: {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const spot = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = spot.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);
  return (
    <div ref={spot} className={className}>
      {near ? children : fallback}
    </div>
  );
}
