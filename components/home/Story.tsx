import Image from "next/image";
import { assets } from "@/data/brand";
import { ArrowLink } from "@/components/ui/ArrowLink";
export function Story() {
  return (
    <section
      id="story"
      className="story section-space"
      aria-labelledby="story-title"
    >
      <div className="container story-grid">
        <div className="story-copy">
          <Image
            className="story-logo"
            src={assets.logo}
            alt=""
            width={50}
            height={50}
          />
          <p className="eyebrow">OUR STORY</p>
          <h2 id="story-title">
            More
            <br />
            Than a Café.
          </h2>
          <p className="body-copy">
            Caffeine is a place for good coffee, fresh crêpes and better
            moments. A space where every sip and every bite turns into a sweet
            moment.
          </p>
          <ArrowLink href="#location">Find your moment</ArrowLink>
        </div>
        <div className="story-mosaic">
          <div className="story-detail">
            <Image
              src={assets.crepe}
              alt="A Lotus crêpe ready for a sweet coffee break"
              fill
              sizes="(max-width: 767px) 50vw, 22vw"
            />
          </div>
          <div className="story-brand-note">
            <Image src={assets.logo} alt="" width={55} height={55} />
            <p>
              Good Coffee,<span className="script">Sweet Moments.</span>
            </p>
          </div>
        </div>
        <div className="story-hand">
          <span className="script">
            Good things
            <br />
            in your hands.
          </span>
          <Image
            src={assets.hand}
            alt="A hand holding a black and gold Caffeine coffee cup"
            fill
            sizes="(max-width: 767px) 55vw, 30vw"
          />
        </div>
        <div className="story-place">
          <Image
            src={assets.storefront}
            alt="The warm, welcoming Caffeine storefront in the evening"
            fill
            sizes="(max-width: 767px) 45vw, 28vw"
          />
          <span className="story-photo-caption">YOUR NEXT FAVORITE PLACE.</span>
        </div>
      </div>
    </section>
  );
}
