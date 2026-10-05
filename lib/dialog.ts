import type { KeyboardEvent } from "react";

/** Keep tab navigation inside the modal, including at browser chrome boundaries. */
export function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
