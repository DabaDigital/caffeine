import Image from "next/image";
import { assets } from "@/data/brand";
import { ArrowLink } from "@/components/ui/ArrowLink";
export function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-sentinel" aria-hidden="true" />
      <div className="hero-visual">
        <Image
          className="hero-image"
          src={assets.hero}
          alt="Iced caramel coffee and a Lotus crêpe on a sunlit café table"
          fill
          sizes="(max-width: 767px) 100vw, 80vw"
          quality={85}
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className="hero-shade" />
      <div className="hero-content container">
        <p className="eyebrow hero-enter">GOOD COFFEE</p>
        <h1 id="hero-title">
          <span className="hero-line">Sweet</span>
          <span className="script hero-line">Moments.</span>
        </h1>
        <div className="hero-enter hero-description">
          <p className="hero-subtitle">More than coffee, a daily escape.</p>
          <p className="body-copy">
            Specialty coffee, irresistible crêpes
            <br className="desktop-break" /> and a little moment for yourself.
          </p>
        </div>
        <div className="hero-enter">
          <ArrowLink href="#menu">Explore the menu</ArrowLink>
        </div>
      </div>
      <div className="hero-arabic hero-enter">
        <p lang="ar" dir="rtl">
          <span>كيف</span>تحلّي يومك؟
        </p>
        <span className="eyebrow">IT’S COFFEE O’CLOCK</span>
      </div>
      <div className="hero-note" aria-hidden="true">
        <span className="script">
          Crêpes.
          <br />
          Good vibes. Always.
        </span>
      </div>
    </section>
  );
}
