import Image from "next/image";
import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";
import { MenuProvider } from "@/components/menu/MenuProvider";
import {
  contactIconComponents,
  socialIconComponents,
} from "@/components/icons";
import type { SiteContent } from "@/lib/content";
import { socialPlatformLabels, summarizeHours } from "@/lib/site";
import { ExperienceHeader } from "./Interactions";
import { MotionRoot } from "./Motion";
import { OpeningHours } from "./OpeningHours";
import { HeroOpening } from "./HeroOpening";
import { MenuSection } from "./MenuSection";
import { Offers } from "./Offers";
import { Pairing } from "./Pairing";
import { Reviews } from "./Reviews";
import { Story } from "./Story";
import s from "./experience.module.css";

/** The homepage. Every product, place, link and review comes from /admin. */
export default function CaffeineExperience({
  content,
}: {
  content: SiteContent;
}) {
  const {
    products,
    locations,
    socials,
    contacts,
    reviews,
    reviewStats,
    offers,
  } = content;
  // Section numbers follow whichever optional sections are shown.
  const sectionOrder = [
    "menu",
    ...(offers.length ? ["offers"] : []),
    "story",
    "reviews",
    "location",
  ];
  const number = (section: string) =>
    String(sectionOrder.indexOf(section) + 1).padStart(2, "0");
  const primary = locations[0] ?? null;
  const otherLocations = locations.slice(1);
  const place = primary
    ? [primary.area, primary.city].filter(Boolean).join(", ")
    : null;
  const [mainSocial, ...otherSocials] = socials;
  const MainSocialIcon = mainSocial
    ? socialIconComponents[mainSocial.platform]
    : null;

  return (
    <MotionRoot>
      <MenuProvider
        items={products}
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
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ExperienceHeader />
        <main id="main">
          <HeroOpening place={place} />

          <MenuSection
            number={number("menu")}
            products={products}
            categories={content.categories}
          />

          {offers.length > 0 && (
            <Offers number={number("offers")} offers={offers} />
          )}

          <Story number={number("story")} place={place} />

          <Pairing products={products} offers={offers} />

          <Reviews
            number={number("reviews")}
            reviews={reviews}
            stats={reviewStats}
            location={
              primary && !primary.mapIsSearch
                ? { name: primary.name, mapUrl: primary.mapUrl }
                : null
            }
          />

          <section
            id="location"
            className={`${s.section} ${s.location} ${primary?.mapEmbedUrl || primary?.image ? "" : s.locationSolo}`}
            aria-labelledby="location-title"
          >
            <div className={s.locationCopy} data-reveal>
              <p className={s.eyebrow}>{number("location")} — YOUR NEW USUAL</p>
              <h2 id="location-title">
                Good coffee.
                <br />
                <em>
                  Right around
                  <br />
                  the corner.
                </em>
              </h2>
              <p>
                Follow the smell of fresh coffee.
                <br />
                We’ll save you a little moment.
              </p>
              {primary ? (
                <>
                  <div className={s.locationDetails}>
                    <div className={s.locationAddress}>
                      <MapPin size={21} />
                      <div>
                        <span>FIND US IN</span>
                        <strong>{place}</strong>
                        {primary.address && <p>{primary.address}</p>}
                      </div>
                    </div>
                    {primary.hours ? (
                      <OpeningHours
                        hours={primary.hours}
                        note={primary.hoursNote}
                      />
                    ) : (
                      primary.hoursNote && (
                        <div className={s.locationAddress}>
                          <Clock size={21} />
                          <div>
                            <span>OPENING HOURS</span>
                            <p className={s.hoursText}>{primary.hoursNote}</p>
                          </div>
                        </div>
                      )
                    )}
                    {primary.phone && primary.phoneHref && (
                      <div className={s.locationAddress}>
                        <Phone size={21} />
                        <div>
                          <span>CALL US</span>
                          <a href={primary.phoneHref}>{primary.phone}</a>
                        </div>
                      </div>
                    )}
                  </div>
                  <a
                    className={s.button}
                    href={primary.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions <ArrowUpRight size={18} />
                  </a>
                  <p className={s.mapNote}>
                    {primary.mapIsSearch
                      ? `Find ${primary.name} on Google Maps`
                      : `Opens ${primary.name} in Google Maps`}
                  </p>
                </>
              ) : (
                <p className={s.mapNote}>
                  Our address is coming soon. Follow us for updates.
                </p>
              )}
            </div>
            {primary?.mapEmbedUrl ? (
              <div className={s.locationMap} data-reveal>
                <iframe
                  src={primary.mapEmbedUrl}
                  title={`Google Map showing ${primary.name} in ${primary.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              primary?.image && (
                <a
                  className={s.locationPhoto}
                  href={primary.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    primary.mapIsSearch
                      ? `Search Google Maps for ${primary.name}`
                      : `Open ${primary.name} in Google Maps`
                  }
                  data-photo
                >
                  <Image
                    src={primary.image}
                    alt={`${primary.name} in ${primary.city}`}
                    fill
                    sizes="(max-width: 767px) 90vw, 50vw"
                  />
                  <span className={s.locationPhotoLabel}>
                    <span>YOUR COFFEE IS WAITING.</span>
                    <ArrowUpRight size={23} />
                  </span>
                </a>
              )
            )}
            {otherLocations.length > 0 && (
              <div className={s.moreLocations}>
                <p className={s.eyebrow}>MORE PLACES TO FIND US</p>
                <ul>
                  {otherLocations.map((location) => (
                    <li key={location.id}>
                      <strong>{location.name}</strong>
                      <span>
                        {[location.address, location.area, location.city]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      {location.hours ? (
                        <span>
                          {summarizeHours(location.hours).join(" · ")}
                        </span>
                      ) : (
                        location.hoursNote && (
                          <span className={s.hoursText}>
                            {location.hoursNote}
                          </span>
                        )
                      )}
                      {location.phone && location.phoneHref && (
                        <a href={location.phoneHref}>{location.phone}</a>
                      )}
                      <a
                        href={location.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Directions to {location.name} <ArrowUpRight size={14} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </main>

        <footer className={s.footer}>
          <div className={s.footerTop}>
            <p>
              A little coffee.
              <br />
              <em>A lot of happy.</em>
            </p>
            {mainSocial && MainSocialIcon && (
              <a
                href={mainSocial.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MainSocialIcon size={19} />
                <span>
                  OUR DAILY BREW
                  <br />
                  <strong>
                    {mainSocial.label ??
                      socialPlatformLabels[mainSocial.platform]}
                  </strong>
                </span>
                <ArrowUpRight size={22} />
              </a>
            )}
          </div>
          {(contacts.length > 0 || otherSocials.length > 0) && (
            <ul className={s.footerConnect} aria-label="Contact and social">
              {contacts.map((contact) => {
                const Icon = contactIconComponents[contact.type];
                return (
                  <li key={contact.id}>
                    <a
                      href={contact.href}
                      {...(contact.type === "whatsapp"
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <Icon size={15} aria-hidden="true" />
                      <span>
                        {contact.label && <small>{contact.label}</small>}
                        {contact.value}
                      </span>
                    </a>
                  </li>
                );
              })}
              {otherSocials.map((link) => {
                const Icon = socialIconComponents[link.platform];
                return (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon size={15} aria-hidden="true" />
                      <span>
                        {link.label ?? socialPlatformLabels[link.platform]}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <a
            href="#home"
            className={s.footerWordmark}
            aria-label="Caffeine, back to top"
          >
            Caffeine<span>®</span>
          </a>
          <div className={s.footerBottom}>
            <span>
              © {new Date().getFullYear()} Caffeine Coffee & Tea House.
            </span>
            <nav aria-label="Footer navigation">
              <a href="#menu">Our Menu</a>
              <a href="#story">Our Story</a>
              <a href="#location">Find Us</a>
            </nav>
            <span>
              BREWED WITH LOVE
              {primary ? ` IN ${primary.city.toLocaleUpperCase()}` : ""}.
            </span>
          </div>
        </footer>
      </MenuProvider>
    </MotionRoot>
  );
}
