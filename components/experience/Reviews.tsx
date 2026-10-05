"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  googlePlaceSchema,
  type GooglePlaceReviews,
} from "@/lib/google-reviews";
import { ArrowUpRight, Star } from "lucide-react";
import type { ReviewStats, SiteReview } from "@/lib/content";
import { useSiteMotion } from "./Motion";
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
  const section = useRef<HTMLElement>(null);
  const { paused } = useSiteMotion();
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

  // The featured quote arrives as if written: its rule draws down, the words
  // ink in and its stars fill, while the big quotation mark drifts behind.
  // The summary's stars fill beside the counting score.
  useEffect(() => {
    const root = section.current;
    if (!root || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const quote = root.querySelector<HTMLElement>("[data-featured]");
      if (quote) {
        const mark = quote.querySelector("[data-mark]");
        gsap
          .timeline({
            scrollTrigger: { trigger: quote, start: "top 85%", once: true },
          })
          .fromTo(
            quote.querySelector("[data-rule]"),
            { scaleY: 0 },
            { scaleY: 1, duration: 1.2, ease: "power3.inOut" },
            0,
          )
          .fromTo(
            mark,
            { opacity: 0, scale: 0.7, rotation: -10 },
            {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 1.3,
              ease: "power3.out",
            },
            0.1,
          )
          .fromTo(
            quote.querySelector("blockquote"),
            { "--ink": 0 },
            {
              "--ink": 1,
              duration: 1.5,
              ease: "power2.out",
              clearProps: "--ink",
            },
            0.2,
          )
          .fromTo(
            quote.querySelectorAll("[data-star-fill]"),
            { "--fill": 0 },
            {
              "--fill": 1,
              duration: 0.9,
              ease: "power2.inOut",
              clearProps: "--fill",
            },
            0.75,
          );
        gsap.fromTo(
          mark,
          { yPercent: -12 },
          {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: quote,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      }
      const summary = root.querySelector<HTMLElement>("[data-summary]");
      if (summary)
        gsap.fromTo(
          summary.querySelectorAll("[data-star-fill]"),
          { "--fill": 0 },
          {
            "--fill": 1,
            duration: 1.4,
            ease: "power3.out",
            clearProps: "--fill",
            scrollTrigger: { trigger: summary, start: "top 90%", once: true },
          },
        );
    });
    return () => media.revert();
  }, [paused]);

  return (
    <section
      ref={section}
      id="reviews"
      className={s.reviews}
      aria-labelledby="reviews-title"
    >
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
          <div className={s.summary} data-reveal data-summary>
            {google && (
              <p className={s.googleAttribution} translate="no">
                Google Maps
              </p>
            )}
            <p className={s.score}>
              <Score value={stats.average} />
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
                  {stats.breakdown.map((row, index) => (
                    <li
                      key={row.stars}
                      style={{ "--row": index } as CSSProperties}
                    >
                      <span className={s.breakdownLabel}>
                        {row.stars}
                        <Star size={11} aria-hidden="true" />
                        <span className="sr-only"> stars:</span>
                      </span>
                      <span className={s.bar} aria-hidden="true">
                        <span
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
              <figure className={s.featured} data-reveal data-featured>
                <span className={s.featuredRule} data-rule aria-hidden="true" />
                <span className={s.featuredMark} data-mark aria-hidden="true">
                  “
                </span>
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
                <ReviewWall filler={<YourTurn location={location} />}>
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
    <li className={s.card} data-card>
      <figure className={s.cardBox}>
        <span className={s.cardMark} aria-hidden="true">
          “
        </span>
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

/** Ends a short last page: the next kind words could be theirs. */
function YourTurn({
  location,
}: {
  location: { name: string; mapUrl: string } | null;
}) {
  return (
    <li className={s.card} data-card>
      <div className={`${s.cardBox} ${s.yourTurn}`}>
        <span className={s.cardMark} aria-hidden="true">
          “
        </span>
        <p className={s.yourTurnLabel}>Your moment</p>
        <p className={s.yourTurnTitle}>
          How was your <em>little coffee break?</em>
        </p>
        {location ? (
          <MapLink location={location} />
        ) : (
          <p className={s.yourTurnNote}>
            Tell our team about your visit next time you stop by.
          </p>
        )}
      </div>
    </li>
  );
}

/** The average, counting up from zero the first time it scrolls into view. */
function Score({ value }: { value: number }) {
  const number = useRef<HTMLElement>(null);
  const { paused } = useSiteMotion();
  useEffect(() => {
    const element = number.current;
    const text = element?.firstChild;
    if (!element || !text || paused) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const shown = { value: 0 };
      // Writes the text node React rendered, so its own updates still land.
      const render = () => {
        text.nodeValue = shown.value.toFixed(1);
      };
      render();
      gsap.to(shown, {
        value,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: render,
        scrollTrigger: { trigger: element, start: "top 90%", once: true },
      });
      return () => {
        text.nodeValue = value.toFixed(1);
      };
    });
    return () => media.revert();
  }, [value, paused]);
  // Screen readers get the average from the sentence beside it.
  return (
    <strong ref={number} aria-hidden="true">
      {value.toFixed(1)}
    </strong>
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
      <span className={`${s.starRow} ${s.starFill}`} data-star-fill>
        {row}
      </span>
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
