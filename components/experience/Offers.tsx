import type { SiteOffer } from "@/lib/content";
import { OfferTickets } from "./OfferTickets";
import s from "./offers.module.css";

/** Running promotions, as tickets printed for the counter. */
export function Offers({
  number,
  offers,
}: {
  number: string;
  offers: SiteOffer[];
}) {
  return (
    <section id="offers" className={s.offers} aria-labelledby="offers-title">
      <div className={s.inner}>
        <header className={s.heading} data-reveal>
          <div>
            <p className={s.eyebrow}>{number} — EXCLUSIVE OFFERS</p>
            <h2 id="offers-title">
              A little <em>extra treat.</em>
            </h2>
          </div>
          <p>
            For a limited time, in our café.
            <br />
            Just ask at the counter.
          </p>
        </header>
        <OfferTickets offers={offers} />
      </div>
    </section>
  );
}
