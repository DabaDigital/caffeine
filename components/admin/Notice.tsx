"use client";

import { useEffect, useState } from "react";
import { CircleCheck, X } from "lucide-react";
import s from "./admin.module.css";

const verbs = { created: "added", updated: "saved", deleted: "deleted" };

/** One-time confirmation after a save or delete redirect. */
export function Notice({
  notice,
  item,
}: {
  notice: string | undefined;
  item: string;
}) {
  const [open, setOpen] = useState(true);
  const verb =
    notice && notice in verbs ? verbs[notice as keyof typeof verbs] : null;

  // Drop the flag from the address so a refresh doesn't repeat the message.
  useEffect(() => {
    if (!verb) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    url.searchParams.delete("n");
    window.history.replaceState(window.history.state, "", url);
  }, [verb]);

  if (!verb || !open) return null;
  return (
    <div className={s.notice} role="status">
      <CircleCheck size={18} aria-hidden="true" />
      <p>
        {item} {verb}. The homepage is up to date.
      </p>
      <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
