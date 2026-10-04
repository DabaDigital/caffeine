import Image from "next/image";
import { Instagram, ArrowUpRight } from "lucide-react";
import { assets, social } from "@/data/brand";
const gallery = [
  {
    image: assets.texture,
    alt: "A close-up of caramel coffee swirling around ice",
    className: "gallery-macro",
    caption: "The little details.",
  },
  {
    image: assets.crepe,
    alt: "Lotus crêpe topped with biscuit crumbs and sweet drizzle",
    className: "gallery-crepe",
    caption: "Sweeten the everyday.",
  },
  {
    image: assets.storefrontCutout,
    alt: "Caffeine’s black and gold café entrance",
    className: "gallery-store",
    caption: "See you at Caffeine.",
  },
  {
    image: assets.hand,
    alt: "Caffeine coffee in hand, ready to go",
    className: "gallery-hand",
    caption: "Your daily plus-one.",
  },
];
export function SocialGallery() {
  return (
    <section
      id="moments"
      className="social-section section-space"
      aria-labelledby="social-title"
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <h2 id="social-title">
              Seen at <em>Caffeine.</em>
            </h2>
            <p className="body-copy">
              Coffee. People. Moments. A little glimpse of our world.
            </p>
          </div>
          <a
            className="text-link"
            href={social.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram size={17} />
            {social.handle}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="gallery-grid">
          {gallery.map((item) => (
            <a
              key={item.className}
              className={`gallery-item ${item.className}`}
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.caption} Visit Caffeine on Instagram`}
            >
              <div className="gallery-image">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 767px) 48vw, 25vw"
                />
              </div>
              <span className="gallery-caption">
                {item.caption}
                <ArrowUpRight size={15} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
