import type { CSSProperties } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import type { ReviewStats, SiteReview } from "@/lib/content";
import { ReviewWall } from "./ReviewWall";
import x from "./experience.module.css";
import s from "./reviews.module.css";

const reviewDate = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join("");
const details = (review: SiteReview) =>
  [review.source, review.date && reviewDate.format(new Date(review.date))]
    .filter(Boolean)
    .join(" · ");

/** The review quoted large: the best rated, preferring a quotable length. */
function pickFeatured(reviews: SiteReview[]) {
  const best = Math.max(...reviews.map((review) => review.rating));
  const top = reviews.filter((review) => review.rating === best);
  return (
    top.find(
      (review) => review.comment.length >= 40 && review.comment.length <= 320,
    ) ?? top[0]
  );
}

/** Guest reviews published in the dashboard. Nothing here is invented. */
export function Reviews({
  number,
  reviews,
  stats,
  location,
}: {
  number: string;
  reviews: SiteReview[];
  stats: ReviewStats | null;
  /** Shown only with a verified Google Maps link, never a search. */
  location: { name: string; mapUrl: string } | null;
}) {
  const featured = reviews.length ? pickFeatured(reviews) : null;
  const others = reviews.filter((review) => review !== featured);

  return (
    <section id="reviews" className={s.reviews} aria-labelledby="reviews-title">
      <div className={s.aside}>
        <div data-reveal>
          <p className={x.eyebrow}>{number} — KIND WORDS</p>
          <h2 id="reviews-title" className={s.title}>
            Warm cups,
            <br />
            <em>kind words.</em>
          </h2>
          <p className={s.intro}>Little moments, in our guests’ own words.</p>
        </div>
        {stats && (
          <div className={s.summary} data-reveal data-grow>
            <p className={s.score}>
              <strong>{stats.average.toFixed(1)}</strong>
              <span className={s.scoreMeta}>
                <Stars value={stats.average} size={16} />
                <span>
                  <span className="sr-only">
                    Average rating {stats.average.toFixed(1)} out of 5,{" "}
                  </span>
                  from {plural(stats.count, "review")}
                </span>
              </span>
            </p>
            <ul className={s.breakdown} aria-label="Reviews by rating">
              {stats.breakdown.map((row) => (
                <li key={row.stars}>
                  <span className={s.breakdownLabel}>
                    {row.stars}
                    <Star size={11} aria-hidden="true" />
                    <span className="sr-only"> stars:</span>
                  </span>
                  <span className={s.bar} aria-hidden="true">
                    <span
                      data-grow-bar
                      style={
                        { "--share": row.count / stats.count } as CSSProperties
                      }
                    />
                  </span>
                  <span className={s.breakdownCount}>
                    {row.count}
                    <span className="sr-only">
                      {row.count === 1 ? " review" : " reviews"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {location && <MapLink location={location} />}
          </div>
        )}
      </div>

      <div className={s.main}>
        {featured ? (
          <>
            <figure className={s.featured} data-reveal>
              <span className={s.quoteMark} aria-hidden="true">
                “
              </span>
              <blockquote>
                <p>{featured.comment}</p>
              </blockquote>
              <figcaption>
                <Stars value={featured.rating} size={14} />
                <span className="sr-only">
                  {featured.rating} out of 5 stars.{" "}
                </span>
                <strong>{featured.author}</strong>
                {details(featured) && <span>{details(featured)}</span>}
              </figcaption>
            </figure>
            {others.length > 0 && (
              <ReviewWall>
                {others.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </ReviewWall>
            )}
          </>
        ) : (
          <div className={s.invite} data-reveal>
            <span className={s.inviteMark} aria-hidden="true">
              “
            </span>
            <p className={s.inviteKicker}>Your moment at Caffeine</p>
            <h3>
              How was your
              <br />
              <em>little coffee break?</em>
            </h3>
            <p>
              We’re gathering our first guest reviews.{" "}
              {location
                ? "Leave a few words on Google Maps, or tell our team next time you stop by."
                : "Tell our team about your visit next time you stop by."}
            </p>
            {location && <MapLink location={location} button />}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: SiteReview }) {
  const meta = details(review);
  return (
    <li className={s.card}>
      <figure>
        <p className={s.cardRating}>
          <Stars value={review.rating} size={13} />
          <span className="sr-only">{review.rating} out of 5 stars</span>
        </p>
        <blockquote>
          <p>{review.comment}</p>
        </blockquote>
        <figcaption className={s.author}>
          <span className={s.avatar} aria-hidden="true">
            {initials(review.author)}
          </span>
          <span>
            <strong>{review.author}</strong>
            {meta && <span>{meta}</span>}
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

/** Five outlined stars with a filled copy clipped to the rating. */
function Stars({ value, size }: { value: number; size: number }) {
  const row = [0, 1, 2, 3, 4].map((star) => (
    <Star key={star} size={size} strokeWidth={1.5} />
  ));
  return (
    <span
      className={s.stars}
      style={{ "--rating": value / 5 } as CSSProperties}
      aria-hidden="true"
    >
      <span className={s.starRow}>{row}</span>
      <span className={`${s.starRow} ${s.starFill}`}>{row}</span>
    </span>
  );
}

function MapLink({
  location,
  button = false,
}: {
  location: { name: string; mapUrl: string };
  button?: boolean;
}) {
  return (
    <a
      className={button ? `${x.button} ${s.cta}` : s.mapLink}
      href={location.mapUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {button ? "Review us on Google Maps" : "Share yours on Google Maps"}
      <span className={s.arrow} aria-hidden="true">
        <ArrowUpRight size={16} strokeWidth={1.7} />
      </span>
      <span className="sr-only"> (opens {location.name} in a new tab)</span>
    </a>
  );
}
