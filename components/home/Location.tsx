import Image from "next/image";
import { MapPin, ArrowUpRight } from "lucide-react";
import { assets, location, mapsSearchUrl } from "@/data/brand";
import { ArrowLink } from "@/components/ui/ArrowLink";
export function Location() {
  return (
    <section
      id="location"
      className="location-section section-space"
      aria-labelledby="location-title"
    >
      <div className="container location-grid">
        <div className="location-copy">
          <p className="eyebrow">MEET YOU HERE</p>
          <h2 id="location-title">
            Caffeine
            <br />
            <em>Maarif.</em>
          </h2>
          <p className="body-copy">
            Your daily escape, in the heart of Maarif. Come for the coffee. Stay
            for the moment.
          </p>
          {location.address && <p>{location.address}</p>}
          {location.hours && <p>{location.hours}</p>}
          {location.phone && (
            <a href={`tel:${location.phone}`}>{location.phone}</a>
          )}
          <ArrowLink href={location.googleMapsUrl ?? mapsSearchUrl} external>
            Find us in Maarif
          </ArrowLink>
        </div>
        <div className="location-photo">
          <Image
            src={assets.storefront}
            alt="Caffeine Coffee & Tea House, with outdoor seating and a warmly lit entrance"
            fill
            sizes="(max-width: 767px) 100vw, 52vw"
            quality={85}
          />
        </div>
        <a
          className="location-card"
          href={location.googleMapsUrl ?? mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={28} strokeWidth={1.3} />
          <div>
            <h3>Caffeine Maarif</h3>
            <p>Casablanca, Morocco</p>
            <span>
              {location.googleMapsUrl
                ? "Open in Maps"
                : "Search on Google Maps"}
              <ArrowUpRight size={16} />
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}
