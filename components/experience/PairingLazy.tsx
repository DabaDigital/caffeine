"use client";

import dynamic from "next/dynamic";
import type { MenuProduct } from "@/lib/content";
import type { PairingBundle } from "./PairingMachine";
import { LazyMount, SkeletonBlock } from "./Skeleton";
import s from "./pairing.module.css";

// The machine's code is only downloaded when the section comes near.
const PairingMachine = dynamic(() => import("./PairingMachine"), {
  ssr: false,
  loading: () => <MachineSkeleton />,
});

export function PairingLazy(props: {
  drinks: MenuProduct[];
  bites: MenuProduct[];
  bundles: PairingBundle[];
}) {
  return (
    <LazyMount className={s.slot} fallback={<MachineSkeleton />}>
      <PairingMachine {...props} />
    </LazyMount>
  );
}

/** The machine's outline while it loads. */
function MachineSkeleton() {
  return (
    <div className={s.machine} aria-hidden="true">
      <SkeletonBlock className={s.skeletonSign} />
      <div className={s.reels}>
        <SkeletonBlock className={s.skeletonReel} />
        <span className={s.join}>&amp;</span>
        <SkeletonBlock className={s.skeletonReel} />
      </div>
      <SkeletonBlock className={s.skeletonResult} />
    </div>
  );
}
