import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Refresh geometry after layout changes, never halfway through a gesture. */
export function watchScrollLayout(elements: HTMLElement[]) {
  let active = true;
  let timer: ReturnType<typeof setTimeout>;
  const refresh = () => {
    ScrollTrigger.removeEventListener("scrollEnd", refresh);
    if (!active) return;
    if (ScrollTrigger.isScrolling()) {
      ScrollTrigger.addEventListener("scrollEnd", refresh);
    } else {
      ScrollTrigger.refresh(true);
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 100);
  };
  const observer = new ResizeObserver(schedule);
  elements.forEach((element) => observer.observe(element));
  void document.fonts.ready.then(() => { if (active) schedule(); });
  return () => {
    active = false;
    clearTimeout(timer);
    observer.disconnect();
    ScrollTrigger.removeEventListener("scrollEnd", refresh);
  };
}
