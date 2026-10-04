import Image from "next/image";
import { assets } from "@/data/brand";
import styles from "./page.module.css";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      className={className}
      src={assets.mark}
      alt=""
      width={57}
      height={55}
      aria-hidden="true"
    />
  );
}

export function Brand() {
  return (
    <a href="#home" className={styles.brand} aria-label="Caffeine home">
      <Image
        src={assets.logo}
        alt="Caffeine Coffee & Tea House"
        width={76}
        height={76}
        sizes="76px"
        loading="eager"
      />
    </a>
  );
}
