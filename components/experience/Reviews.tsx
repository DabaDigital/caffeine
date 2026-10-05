"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  googlePlaceSchema,
  type GooglePlaceReviews,
} from "@/lib/google-reviews";
import { ArrowUpRight, Star } from "lucide-react";
import type { ReviewStats, SiteReview } from "@/lib/content";
import { ReviewWall } from "./ReviewWall";
import { ReviewText } from "./ReviewText";
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
  reviews: guestReviews,
  stats: guestStats,
  location: guestLocation,
}: {
  number: string;
  reviews: SiteReview[];
  stats: ReviewStats | null;
  /** Shown only with a verified Google Maps link, never a search. */
  location: { name: string; mapUrl: string } | null;
}) {
  const [google, setGoogle] = useState<GooglePlaceReviews | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/google-reviews", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const result = googlePlaceSchema.safeParse(await response.json());
        if (result.success && !controller.signal.aborted)
          setGoogle(result.data);
      })
      .catch(() => {
        /* Keep dashboard reviews when Google is unavailable. */
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (google) ScrollTrigger.refresh();
  }, [google]);
  const googleReviews: SiteReview[] = google
    ? google.reviews
        .filter((review) => review.text?.text)
        .map((review) => ({
          id: review.name,
          author: review.authorAttribution.displayName,
          authorUrl: review.authorAttribution.uri,
          authorPhoto: review.authorAttribution.photoUri,
          reviewUrl: review.googleMapsUri,
          rating: review.rating,
          comment: review.text!.text,
          date: review.publishTime ?? null,
          source: "Google Maps",
        }))
    : [];
  const stats = google
    ? { average: google.rating, count: google.userRatingCount, breakdown: [] }
    : guestStats;
  const location = google
    ? { name: google.displayName.text, mapUrl: google.googleMapsUri }
    : guestLocation;
  const featured = guestReviews.length ? pickFeatured(guestReviews) : null;
  const others = guestReviews.filter((review) => review !== featured);

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
            {google && (
              <p className={s.googleAttribution} translate="no">
                Google Maps
              </p>
            )}
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
            {stats.breakdown.length > 0 && (
              <details className={s.ratingDetails}>
                <summary>
                  Rating breakdown <span aria-hidden="true">+</span>
                </summary>
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
                            {
                              "--share": stats.count
                                ? row.count / stats.count
                                : 0,
                            } as CSSProperties
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
              </details>
            )}
            {google && (
              <a
                className={s.googlePolicy}
                href="https://support.google.com/contributionpolicy/answer/7400114"
                target="_blank"
                rel="noopener noreferrer"
              >
                About Google reviews
              </a>
            )}
            {location && <MapLink location={location} />}
          </div>
        )}
      </div>

      <div className={s.main}>
        <div role="region" aria-label="Caffeine guest reviews">
          <p className={s.guestLabel}>FROM OUR GUEST BOOK</p>
          {guestStats && (
            <p className={s.sourceSummary}>
              {guestStats.average.toFixed(1)} / 5 ·{" "}
              {plural(guestStats.count, "review")} shared with Caffeine
            </p>
          )}
          {featured ? (
            <>
              <figure className={s.featured} data-reveal>
                <p className={s.featuredLabel}>A MOMENT WORTH SHARING</p>
                <ReviewText text={featured.comment} author={featured.author} />
                <figcaption>
                  <Stars value={featured.rating} size={14} />
                  <span className="sr-only">
                    {featured.rating} out of 5 stars.{" "}
                  </span>
                  {featured.authorPhoto && <AuthorPhoto review={featured} />}
                  <ReviewAuthor review={featured} />
                  {details(featured) && <span>{details(featured)}</span>}
                  {featured.reviewUrl && (
                    <a
                      href={featured.reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View review ↗
                    </a>
                  )}
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
                {google
                  ? "Discover more guest experiences on Google Maps. "
                  : "We’re gathering our first guest reviews. "}
                {location
                  ? "Leave a few words on Google Maps, or tell our team next time you stop by."
                  : "Tell our team about your visit next time you stop by."}
              </p>
              {location && <MapLink location={location} button />}
            </div>
          )}
        </div>
        {googleReviews.length > 0 && (
          <div
            className={s.googleReviews}
            role="region"
            aria-label="Google Maps reviews"
          >
            <p className={s.googleAttribution} translate="no">
              Google Maps
            </p>
            <p className={s.sourceSummary}>
              Reviews with text, ordered by relevance
            </p>
            <ReviewWall>
              {googleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ReviewWall>
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
        <ReviewText text={review.comment} author={review.author} />
        <figcaption className={s.author}>
          {review.authorPhoto ? (
            <AuthorPhoto review={review} />
          ) : (
            <span className={s.avatar} aria-hidden="true">
              {initials(review.author)}
            </span>
          )}
          <span>
            <ReviewAuthor review={review} />
            {meta && <span>{meta}</span>}
            {review.reviewUrl && (
              <a
                className={s.googlePolicy}
                href={review.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View review ↗
              </a>
            )}
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

function AuthorPhoto({ review }: { review: SiteReview }) {
  // Google attribution images are displayed directly, never cached by our image optimizer.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={s.avatar}
      src={review.authorPhoto}
      alt={`${review.author}’s profile`}
      width={38}
      height={38}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

function ReviewAuthor({ review }: { review: SiteReview }) {
  return (
    <strong>
      {review.authorUrl ? (
        <a href={review.authorUrl} target="_blank" rel="noopener noreferrer">
          {review.author}
        </a>
      ) : (
        review.author
      )}
    </strong>
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
