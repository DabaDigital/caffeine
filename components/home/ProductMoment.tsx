import Image from "next/image";
import { assets } from "@/data/brand";
export function ProductMoment() {
  return (
    <section className="product-moment" aria-labelledby="moment-title">
      <Image
        className="moment-texture"
        src={assets.texture}
        alt=""
        fill
        sizes="100vw"
        loading="lazy"
      />
      <div className="moment-inner container">
        <p className="eyebrow">A LITTLE BREAK. A LOT TO LOVE.</p>
        <h2 id="moment-title" className="moment-type">
          <span>YOUR DAILY</span>
          <span>
            CAFFEINE<span className="gold">.</span>
          </span>
        </h2>
        <div className="moment-coffee">
          <Image
            src={assets.iced}
            alt="Caffeine iced caramel coffee"
            fill
            sizes="(max-width: 767px) 220px, 340px"
          />
        </div>
        <div className="moment-crepe">
          <Image
            src={assets.crepe}
            alt="Lotus crêpe with biscuit topping"
            fill
            sizes="(max-width: 767px) 160px, 350px"
          />
        </div>
        <div className="moment-hot">
          <Image src={assets.hot} alt="" fill sizes="180px" />
        </div>
        <p className="moment-caption script">Take a moment. Make it sweet.</p>
      </div>
    </section>
  );
}
