import Image from "next/image";
import { ArrowDown, ArrowUpRight, MapPin, Star } from "lucide-react";
import type { SiteContent } from "@/lib/content";
import { formatPrice, socialPlatformLabels } from "@/lib/site";
import { OpeningHours } from "@/components/experience/OpeningHours";
import { MenuProvider } from "@/components/menu/MenuProvider";
import {
  BrewMotion,
  BrewHeader,
  BrewHero,
  MenuButton,
  Ritual,
} from "./Interactions";
import { BrewMenu } from "./BrewMenu";
import s from "./brew.module.css";

const delivery = "https://glovoapp.com/fr/ma/casablanca/stores/caffeine-cas";

export default function CaffeineExperience({
  content,
}: {
  content: SiteContent;
}) {
  const primary = content.locations[0];
  const place = primary
    ? [primary.area, primary.city].filter(Boolean).join(", ")
    : "Maarif, Casablanca";
  const quote =
    content.reviews.find(
      (review) => review.comment.length > 30 && review.comment.length < 200,
    ) ?? content.reviews[0];

  return (
    <BrewMotion>
      <MenuProvider
        items={content.products}
        categories={content.categories.map((category) => category.name)}
        location={
          primary
            ? {
                name: primary.name,
                place: primary.area ?? primary.city,
                mapUrl: primary.mapUrl,
              }
            : null
        }
      >
        <div className={s.site}>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <BrewHeader delivery={delivery} />
          <main id="main">
            <BrewHero place={place} />
            <div className={s.ticker} aria-hidden="true">
              <div data-brew-ticker>
                {[0, 1, 2, 3].map((n) => (
                  <span key={n}>
                    GOOD COFFEE <span>✳</span> SWEET MOMENTS <span>✳</span> MADE
                    IN MAARIF <span>✳</span>{" "}
                  </span>
                ))}
              </div>
            </div>

            <section
              className={s.menuSection}
              id="menu"
              aria-labelledby="menu-title"
            >
              <div className={s.sectionMeta}>
                <span>01 / THE GOOD STUFF</span>
                <span>YOUR MOOD. YOUR ORDER.</span>
              </div>
              <div className={s.sectionHeading} data-brew-reveal>
                <h2 id="menu-title">
                  FIND YOUR
                  <br />
                  <em>usual.</em>
                </h2>
                <div>
                  <p>
                    A bold little espresso. An iced caramel obsession.
                    <br />
                    Or something sweet to make a good day better.
                  </p>
                  <MenuButton className={s.textLink}>
                    Explore the full menu <ArrowUpRight size={18} />
                  </MenuButton>
                </div>
              </div>
              <BrewMenu
                products={content.products}
                categories={content.categories}
              />
            </section>

            <Ritual />

            <section
              id="story"
              className={s.story}
              aria-labelledby="story-title"
            >
              <div className={s.sectionMeta}>
                <span>03 / YOUR NEIGHBOURHOOD, CAFFEINATED</span>
                <span>DU GRAIN À LA TASSE</span>
              </div>
              <div className={s.storyHeading} data-brew-reveal>
                <h2 id="story-title">
                  COME FOR THE COFFEE.
                  <br />
                  <em>Stay for the feeling.</em>
                </h2>
                <div className={s.storyNote}>
                  <Image
                    src="/assets/brand-mark.png"
                    width={66}
                    height={66}
                    alt=""
                  />
                  <p>
                    Some places just feel right.
                    <br />
                    This is one of them.
                  </p>
                </div>
              </div>
              <div className={s.storyGrid}>
                <figure className={s.storePhoto} data-brew-photo>
                  <Image
                    src="/assets/caffeine-dusk.webp"
                    alt="The warm glow of Caffeine’s black and gold storefront"
                    fill
                    sizes="(max-width: 700px) 100vw, 65vw"
                  />
                  <figcaption>
                    <span>CAFFEINE / {place.toUpperCase()}</span>
                    <ArrowUpRight size={21} />
                  </figcaption>
                </figure>
                <div className={s.storySide}>
                  <figure className={s.interiorPhoto} data-brew-photo>
                    <Image
                      src="/assets/caffeine-bar.webp"
                      alt="The wood-lined Caffeine espresso bar and its hanging lights"
                      fill
                      sizes="(max-width: 700px) 90vw, 30vw"
                    />
                  </figure>
                  <p>
                    Warm wood. The sound of the espresso machine. Your favourite
                    corner and a conversation that turns into another cup.
                  </p>
                  <p>
                    We’re Caffeine. Your little pause in the middle of{" "}
                    {primary?.city ?? "Casablanca"}.
                  </p>
                  <a href="#location" className={s.textLink}>
                    Make yourself at home <ArrowDown size={18} />
                  </a>
                </div>
              </div>
            </section>

            {content.offers.length > 0 && (
              <section
                className={s.offers}
                id="offers"
                aria-labelledby="offers-title"
              >
                <div className={s.sectionMeta}>
                  <span>A LITTLE SOMETHING EXTRA</span>
                  <span>IN THE CAFÉ</span>
                </div>
                <h2 id="offers-title">
                  GOOD THINGS.
                  <br />
                  <span>BETTER TOGETHER.</span>
                </h2>
                <div className={s.offerList}>
                  {content.offers.map((offer) => (
                    <article key={offer.id}>
                      <div>
                        <span className={s.mono}>
                          {offer.bundle ? "THE PERFECT PAIR" : offer.label}
                        </span>
                        <h3>{offer.title}</h3>
                        <p>
                          {offer.description ||
                            offer.items
                              .map((item) => item.product.name)
                              .join(offer.bundle ? " + " : " · ")}
                        </p>
                        {!offer.bundle && (
                          <ul className={s.offerItems}>
                            {offer.items.map(({ product, price, regular }) => (
                              <li key={product.id}>
                                <span>{product.name}</span>
                                <span>
                                  {formatPrice(price)} MAD{" "}
                                  <s>{formatPrice(regular)}</s>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className={s.offerPrice}>
                        {offer.bundle ? (
                          <>
                            <strong>
                              {formatPrice(offer.offer)} <small>MAD</small>
                            </strong>
                            <s>{formatPrice(offer.regular)} MAD</s>
                          </>
                        ) : (
                          <strong>{offer.label}</strong>
                        )}
                        {offer.until && (
                          <span>
                            Until{" "}
                            {new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "UTC",
                            }).format(new Date(`${offer.until}T12:00:00Z`))}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {quote && (
              <section
                className={s.quote}
                aria-label="Words from our guests"
                data-brew-reveal
              >
                <div className={s.quoteLabel}>
                  <Star size={17} fill="currentColor" />
                  <span>THE WORD AROUND THE NEIGHBOURHOOD</span>
                </div>
                <blockquote>“{quote.comment}”</blockquote>
                <div className={s.quoteByline}>
                  <span>{quote.author}</span>
                  {content.reviewStats && (
                    <span>
                      {content.reviewStats.average.toFixed(1)} / 5 ·{" "}
                      {content.reviewStats.count} guest reviews
                    </span>
                  )}
                </div>
                {content.reviews.length > 1 && (
                  <details className={s.guestNotes}>
                    <summary>Read all guest notes</summary>
                    <ul>
                      {content.reviews.map((review) => (
                        <li key={review.id}>
                          <p>“{review.comment}”</p>
                          <span>
                            {review.author} · {review.rating}/5
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}

            <section
              id="location"
              className={s.location}
              aria-labelledby="location-title"
            >
              <div className={s.locationImage} data-brew-photo>
                <Image
                  src={primary?.image ?? "/assets/cafe-storefront.webp"}
                  alt="Find your next coffee at Caffeine"
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              </div>
              <div className={s.locationCopy}>
                <span className={s.mono}>
                  YOUR NEXT COFFEE IS CLOSER THAN YOU THINK
                </span>
                <h2 id="location-title">
                  SAME PLACE.
                  <br />
                  <span>NEW RITUAL.</span>
                </h2>
                {primary ? (
                  <>
                    <div className={s.address}>
                      <MapPin size={20} />
                      <div>
                        <strong>{place}</strong>
                        <p>{primary.address}</p>
                      </div>
                    </div>
                    {primary.hours && (
                      <div className={s.hours}>
                        <OpeningHours
                          hours={primary.hours}
                          note={primary.hoursNote}
                        />
                      </div>
                    )}
                    {!primary.hours && primary.hoursNote && (
                      <p className={s.hours}>{primary.hoursNote}</p>
                    )}
                    <a
                      className={s.solidButton}
                      href={primary.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get directions <ArrowUpRight size={18} />
                    </a>
                    {primary.phoneHref && (
                      <a className={s.phone} href={primary.phoneHref}>
                        {primary.phone}
                      </a>
                    )}
                  </>
                ) : (
                  <a
                    className={s.solidButton}
                    href="https://maps.app.goo.gl/nHFJgYSuhNRjHfEG6"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Find Caffeine Maarif <ArrowUpRight size={18} />
                  </a>
                )}
              </div>
              {content.locations.slice(1).map((location) => (
                <a
                  className={s.otherLocation}
                  key={location.id}
                  href={location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>
                    {location.name} ·{" "}
                    {[location.area, location.city].filter(Boolean).join(", ")}
                  </span>
                  <ArrowUpRight />
                </a>
              ))}
            </section>
          </main>
          <footer className={s.footer}>
            <div className={s.footerTop}>
              <p>
                Life happens.
                <br />
                <strong>Coffee helps.</strong>
              </p>
              <nav aria-label="Social links">
                {content.socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {socialPlatformLabels[social.platform]}{" "}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
                <a href={delivery} target="_blank" rel="noopener noreferrer">
                  Order on Glovo <ArrowUpRight size={15} />
                </a>
                {content.contacts.map((contact) => (
                  <a key={contact.id} href={contact.href}>
                    {contact.label || contact.value}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </nav>
              <a href="#home" className={s.backTop} aria-label="Back to top">
                <ArrowUpRight />
              </a>
            </div>
            <a
              href="#home"
              className={s.footerWord}
              aria-label="Caffeine, back to top"
            >
              CAFFEINE<span>✳</span>
            </a>
            <div className={s.footerBottom}>
              <span>© 2026 CAFFEINE · COFFEE & TEA HOUSE</span>
              <span>BREWED WITH LOVE IN CASABLANCA</span>
              <a href="#menu">
                ONE MORE CUP? <ArrowUpRight size={13} />
              </a>
            </div>
          </footer>
        </div>
      </MenuProvider>
    </BrewMotion>
  );
}
