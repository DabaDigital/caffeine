import Image from "next/image";
import localFont from "next/font/local";
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Heart,
  Instagram,
  MapPin,
} from "lucide-react";
import { assets, mapsSearchUrl, social } from "@/data/brand";
import { MenuProvider } from "@/components/menu/MenuProvider";
import { Brand, BrandMark } from "./Brand";
import { DesignHeader, MenuAction, StoryAction } from "./Interactions";
import { designMenu } from "./menu";
import styles from "./page.module.css";

const display = localFont({
  src: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2",
  variable: "--font-design-display",
  display: "swap",
  fallback: ["Georgia"],
});

export default function CaffeinePage() {
  return (
    <div className={`${styles.page} ${display.variable}`}>
      <MenuProvider items={designMenu}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <DesignHeader />
        <main id="main">
          <section
            id="home"
            className={styles.hero}
            aria-labelledby="hero-title"
          >
            <div className={styles.heroScene}>
              <Image
                src={assets.hero}
                alt="Caramel iced coffee and a chocolate Lotus crêpe on a sunlit café table"
                fill
                sizes="100vw"
                quality={85}
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className={styles.heroShade} />
            <div className={styles.heroContent}>
              <p className={styles.eyebrow}>IT’S COFFEE O’CLOCK</p>
              <h1 id="hero-title" className={styles.heroTitle}>
                <span>Good</span>
                <span>Coffee,</span>
                <span className={styles.heroScript}>
                  Sweet<span>Moments.</span>
                </span>
              </h1>
              <div className={styles.heroDescription}>
                <p>
                  Specialty coffee, irresistible crêpes and
                  <br className={styles.desktopBreak} /> sweet moments — all in
                  one place.
                </p>
              </div>
              <a className={styles.button} href="#menu">
                Explore Menu <ArrowRight size={18} />
              </a>
              <div className={styles.heroCommunity}>
                <div className={styles.communityImages} aria-hidden="true">
                  {[assets.iced, assets.crepe, assets.hot].map((src) => (
                    <span key={src}>
                      <Image src={src} alt="" width={38} height={38} />
                    </span>
                  ))}
                  <span>
                    <Heart size={16} />
                  </span>
                </div>
                <p>
                  A little coffee.
                  <br />
                  <span>A whole lot of happiness.</span>
                </p>
              </div>
            </div>
            <div className={styles.arabicNote}>
              <p lang="ar" dir="rtl">
                <span>كيف</span>
                <span>تحلّي يومك؟</span>
              </p>
              <span className={styles.eyebrow}>
                SWEET MOMENTS
                <br />
                EVERYDAY
              </span>
            </div>
            <p
              className={`${styles.handwriting} ${styles.heroNote}`}
              aria-hidden="true"
            >
              Crêpes
              <br />
              Good Vibes
              <br />
              <span>Always ♡</span>
            </p>
          </section>

          <section
            id="menu"
            className={styles.signatures}
            aria-labelledby="menu-title"
          >
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>OUR SIGNATURES</p>
              <h2 id="menu-title">Coffee. Crêpes. Good Vibes.</h2>
              <span
                className={`${styles.handwriting} ${styles.signatureNote}`}
                aria-hidden="true"
              >
                More
                <br />
                Than a Café <Heart size={19} />
              </span>
            </div>
            <div className={styles.productGrid}>
              {designMenu.map((product, index) => (
                <article key={product.id} className={styles.productCard}>
                  <MenuAction
                    className={`${styles.productVisual} ${styles[`productVisual${index}`]}`}
                    product={product}
                    label={`View ${product.name}`}
                  >
                    <Image
                      className={styles.productBackdrop}
                      src={assets.hero}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 100vw, 33vw"
                    />
                    <Image
                      className={styles.productImage}
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 600px) 90vw, 33vw"
                      quality={85}
                    />
                    <span className={styles.viewProduct}>
                      A closer look <ArrowUpRight size={16} />
                    </span>
                  </MenuAction>
                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <span className={styles.price}>{product.price} MAD</span>
                    <p>{product.description}</p>
                    <MenuAction
                      className={styles.productArrow}
                      product={product}
                      label={`Details for ${product.name}`}
                    >
                      <ArrowRight size={19} />
                    </MenuAction>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="story"
            className={styles.story}
            aria-labelledby="story-title"
          >
            <div className={styles.storyCopy}>
              <div className={styles.storyLabel}>
                <BrandMark />
                <p className={styles.eyebrow}>OUR STORY</p>
              </div>
              <h2 id="story-title">
                More
                <br />
                Than a Café.
              </h2>
              <p className={styles.storyDescription}>
                Caffeine is a place for good coffee,
                <br />
                great crêpes and better people.
                <br />A space where every sip and bite
                <br />
                turns into a sweet moment.
              </p>
              <StoryAction />
              <p
                className={`${styles.handwriting} ${styles.storyNote}`}
                aria-hidden="true"
              >
                Same
                <br />
                People.
                <br />
                Bigger
                <br />
                Moments ♡
              </p>
            </div>
            <div className={styles.storyStorefront}>
              <Image
                src={assets.storefront}
                alt="The gold Caffeine sign above our warmly lit café entrance"
                fill
                sizes="(max-width: 600px) 100vw, 36vw"
                quality={85}
              />
            </div>
            <div className={styles.storyHand}>
              <Image
                className={styles.handBackdrop}
                src={assets.storefront}
                alt=""
                fill
                sizes="(max-width: 600px) 50vw, 30vw"
              />
              <Image
                className={styles.handImage}
                src={assets.hand}
                alt="A freshly made coffee in a black and gold Caffeine cup"
                fill
                sizes="(max-width: 600px) 70vw, 30vw"
              />
              <p className={styles.handwriting} aria-hidden="true">
                Good
                <br />
                Coffee
                <br />
                People
                <br />
                Moments ♡
              </p>
            </div>
          </section>

          <section
            id="location"
            className={styles.location}
            aria-labelledby="location-title"
          >
            <div className={styles.locationIntro}>
              <p className={styles.eyebrow}>OUR LOCATION</p>
              <h2 id="location-title">Caffeine Maarif</h2>
              <p>
                Visit us in the heart of Maarif for your
                <br />
                daily coffee, crêpes and sweet moments.
              </p>
              <a
                className={styles.button}
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions <ArrowRight size={16} />
              </a>
            </div>
            <div className={styles.locationDetails}>
              <div>
                <MapPin />
                <p>
                  <strong>Caffeine Maarif</strong>
                  <span>It’s Coffee O’clock ✨</span>
                  <small>
                    Maarif, Casablanca
                    <br />
                    Morocco
                  </small>
                </p>
              </div>
              <div>
                <Coffee />
                <p>
                  <strong>Your daily coffee date</strong>
                  <span>Come for a cup. Stay for a moment.</span>
                </p>
              </div>
            </div>
            <a
              className={styles.map}
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Search for Caffeine Maarif on Google Maps"
            >
              <svg
                className={styles.mapLines}
                viewBox="0 0 400 180"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="map-blocks"
                    width="62"
                    height="49"
                    patternTransform="rotate(-37)"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x="5"
                      y="5"
                      width="51"
                      height="38"
                      rx="2"
                      fill="#272824"
                      stroke="#41413a"
                      strokeWidth=".7"
                    />
                    <path
                      d="M26 5V43M5 24H56"
                      stroke="#34352f"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="180" fill="url(#map-blocks)" />
                <path
                  d="M-20 150 220 0M110 190 350 0M-20 10 320 190M250 -20 390 160"
                  stroke="#626159"
                  strokeWidth="3"
                />
              </svg>
              <span className={styles.mapPin}>
                <MapPin size={40} fill="currentColor" />
                <span>
                  Caffeine
                  <br />
                  Maarif
                </span>
              </span>
              <span className={styles.mapCaption}>
                Find us on Google Maps <ArrowUpRight size={13} />
              </span>
            </a>
          </section>
        </main>
        <footer className={styles.footer}>
          <Brand />
          <nav aria-label="Footer navigation">
            <a href="#menu">Menu</a>
            <a href="#story">Our Story</a>
            <a href="#location">Locations</a>
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
          </nav>
          <div className={styles.footerSocial}>
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Caffeine on Instagram"
            >
              <Instagram size={19} />
            </a>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Find Caffeine on Google Maps"
            >
              <MapPin size={20} />
            </a>
          </div>
          <p className={styles.handwriting}>Good Coffee, Sweet Moments. ♡</p>
        </footer>
      </MenuProvider>
    </div>
  );
}
