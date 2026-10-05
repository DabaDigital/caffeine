"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Pencil,
  Star,
  X,
} from "lucide-react";
import type { FormState } from "@/lib/form-state";
import type { ReviewStatus } from "@/lib/site";
import { DeleteButton, ToggleSwitch } from "./controls";
import s from "./admin.module.css";

export type ReviewRow = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  /** Where and when it was written, e.g. "Website · Oct 5, 2026". */
  origin: string;
  status: ReviewStatus;
  published: boolean;
};

type Decision = "approve" | "decline";
type Work = { ids: string[]; decision: Decision; bulk: boolean };
type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * One page of reviews. A waiting review is approved or declined in its row,
 * or several at once once ticked; the list updates where it is.
 */
export function ReviewTable({
  reviews,
  waiting = [],
  empty,
  moderate,
  toggle,
  remove,
}: {
  reviews: ReviewRow[];
  /** Every waiting review, on all pages, when only those are listed. */
  waiting?: string[];
  /** Shown when this page has no reviews. */
  empty: ReactNode;
  moderate: (
    ids: string[],
    decision: Decision,
  ) => Promise<FormState & { count?: number }>;
  toggle: Action;
  remove: Action;
}) {
  const selectable = waiting.length > 0;
  const [ticked, setTicked] = useState<string[]>([]);
  const [everyPage, setEveryPage] = useState(false);
  const [work, setWork] = useState<Work | null>(null);
  const [result, setResult] = useState<{ text: string; error?: boolean }>();
  const [pending, startTransition] = useTransition();
  const table = useRef<HTMLTableElement>(null);
  const pageBox = useRef<HTMLInputElement>(null);

  const onPage = reviews
    .filter((review) => review.status === "pending")
    .map((review) => review.id);
  // Only reviews still waiting count, so approved ones drop out on their own.
  const chosen = everyPage
    ? waiting
    : ticked.filter((id) => onPage.includes(id));
  const wholePage =
    onPage.length > 0 && onPage.every((id) => chosen.includes(id));

  useEffect(() => {
    if (pageBox.current)
      pageBox.current.indeterminate = chosen.length > 0 && !wholePage;
  });

  // Success fades after a while; a problem stays until the next try.
  useEffect(() => {
    if (!result || result.error) return;
    const timer = setTimeout(() => setResult(undefined), 6000);
    return () => clearTimeout(timer);
  }, [result]);

  // The button pressed may be gone with its row: carry on at the next review.
  useEffect(() => {
    if (!result || document.activeElement !== document.body) return;
    table.current
      ?.querySelector<HTMLElement>("tbody input, tbody button, tbody a[href]")
      ?.focus();
  }, [result, reviews]);

  function decide(ids: string[], decision: Decision, bulk = false) {
    setWork({ ids, decision, bulk });
    setResult(undefined);
    startTransition(async () => {
      const outcome = await moderate(ids, decision);
      setWork(null);
      if (outcome.message) {
        setResult({ text: outcome.message, error: true });
        return;
      }
      const count = outcome.count ?? ids.length;
      setTicked([]);
      setEveryPage(false);
      setResult({
        text: `${count === 1 ? "Review" : `${count} reviews`} ${decision === "approve" ? "approved" : "declined"}. The homepage is up to date.`,
      });
    });
  }

  function tick(id: string) {
    const current = everyPage ? onPage : chosen;
    setEveryPage(false);
    setTicked(
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );
  }

  const spinner = (decision: Decision, bulk: boolean, id?: string) =>
    work?.decision === decision &&
    work.bulk === bulk &&
    (!id || work.ids.includes(id));

  return (
    <>
      {selectable && onPage.length > 0 && (
        <div className={s.bulkBar}>
          <label className={s.bulkSelect}>
            <input
              ref={pageBox}
              type="checkbox"
              className={s.check}
              checked={wholePage}
              onChange={() => {
                setEveryPage(false);
                setTicked(wholePage ? [] : onPage);
              }}
            />
            Select page
          </label>
          <span className={s.bulkCount} aria-live="polite">
            {everyPage
              ? `All ${waiting.length} waiting reviews are selected.`
              : chosen.length
                ? `${chosen.length} selected.`
                : "Tick reviews to approve or decline several at once."}
          </span>
          {wholePage && !everyPage && waiting.length > onPage.length && (
            <button
              type="button"
              className={s.linkButton}
              onClick={() => setEveryPage(true)}
            >
              Select all {waiting.length} waiting reviews
            </button>
          )}
          {everyPage && (
            <button
              type="button"
              className={s.linkButton}
              onClick={() => {
                setEveryPage(false);
                setTicked([]);
              }}
            >
              Clear selection
            </button>
          )}
          <div className={s.bulkActions}>
            <button
              type="button"
              className={`${s.buttonSecondary} ${s.buttonSmall}`}
              disabled={!chosen.length || pending}
              onClick={() => decide(chosen, "decline", true)}
            >
              <DecisionIcon
                decision="decline"
                busy={spinner("decline", true)}
              />
              Decline selected
            </button>
            <button
              type="button"
              className={`${s.button} ${s.buttonSmall}`}
              disabled={!chosen.length || pending}
              onClick={() => decide(chosen, "approve", true)}
            >
              <DecisionIcon
                decision="approve"
                busy={spinner("approve", true)}
              />
              Approve selected
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        empty
      ) : (
        <table ref={table} className={s.table}>
          <thead>
            <tr>
              <th scope="col">Guest</th>
              <th scope="col">Review</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr
                key={review.id}
                data-selected={chosen.includes(review.id) || undefined}
              >
                <td className={s.cellMain}>
                  <div className={s.itemTitle}>
                    {selectable && review.status === "pending" && (
                      <input
                        type="checkbox"
                        className={s.check}
                        checked={chosen.includes(review.id)}
                        onChange={() => tick(review.id)}
                        aria-label={`Select the review by ${review.author}`}
                      />
                    )}
                    <span
                      className={`${s.thumb} ${s.thumbRound}`}
                      aria-hidden="true"
                    >
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <Link href={`/admin/reviews/${review.id}`}>
                        <strong>{review.author}</strong>
                      </Link>
                      <span>{review.origin}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Review" className={s.cellWide}>
                  <ReviewQuote
                    rating={review.rating}
                    text={review.comment}
                    author={review.author}
                  />
                </td>
                <td data-label="Status">
                  {review.status === "approved" ? (
                    <ToggleSwitch
                      action={toggle}
                      id={review.id}
                      field="is_published"
                      checked={review.published}
                      label={`Publish the review by ${review.author}`}
                      states={["Published", "Hidden"]}
                    />
                  ) : (
                    <div className={s.rowDecision}>
                      {review.status === "declined" && (
                        <span className={`${s.pill} ${s.pillEnded}`}>
                          Declined
                        </span>
                      )}
                      {review.status === "pending" && (
                        <button
                          type="button"
                          className={`${s.buttonSecondary} ${s.buttonSmall}`}
                          disabled={pending}
                          onClick={() => decide([review.id], "decline")}
                        >
                          <DecisionIcon
                            decision="decline"
                            busy={spinner("decline", false, review.id)}
                          />
                          Decline
                          <span className="sr-only">
                            {" "}
                            the review by {review.author}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${s.button} ${s.buttonSmall}`}
                        disabled={pending}
                        onClick={() => decide([review.id], "approve")}
                      >
                        <DecisionIcon
                          decision="approve"
                          busy={spinner("approve", false, review.id)}
                        />
                        Approve
                        <span className="sr-only">
                          {" "}
                          the review by {review.author}
                        </span>
                      </button>
                    </div>
                  )}
                </td>
                <td className={s.cellActions}>
                  <div className={s.actions}>
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      className={s.iconButton}
                      aria-label={`Edit the review by ${review.author}`}
                    >
                      <Pencil size={17} />
                    </Link>
                    <DeleteButton
                      action={remove}
                      id={review.id}
                      name={`Review by ${review.author}`}
                      what="review"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Always present, so screen readers hear each result. */}
      <div
        className={s.toast}
        data-shown={result ? "" : undefined}
        data-error={result?.error ? "" : undefined}
      >
        {result &&
          (result.error ? (
            <CircleAlert size={18} aria-hidden="true" />
          ) : (
            <CircleCheck size={18} aria-hidden="true" />
          ))}
        <span role="status">{result?.text}</span>
        {result && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setResult(undefined)}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </>
  );
}

function DecisionIcon({
  decision,
  busy,
}: {
  decision: Decision;
  busy: boolean;
}) {
  if (busy)
    return <LoaderCircle size={15} className={s.spin} aria-hidden="true" />;
  return decision === "approve" ? (
    <Check size={15} aria-hidden="true" />
  ) : (
    <X size={15} aria-hidden="true" />
  );
}

/** Rating and text, cut at two lines with a button to read the rest. */
function ReviewQuote({
  rating,
  text,
  author,
}: {
  rating: number;
  text: string;
  author: string;
}) {
  const id = useId();
  const quote = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);

  useEffect(() => {
    const element = quote.current;
    if (!element || open) return;
    const measure = () =>
      setCut(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [open, text]);

  return (
    <div className={s.reviewCell}>
      <span
        className={s.stars}
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            aria-hidden="true"
            data-filled={star <= rating}
          />
        ))}
      </span>
      <p ref={quote} id={id} className={open ? s.quoteOpen : s.quote}>
        {text}
      </p>
      {(cut || open) && (
        <button
          type="button"
          className={s.linkButton}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {open ? "Show less" : "Read all"}
          <span className="sr-only"> of {author}’s review</span>
        </button>
      )}
    </div>
  );
}
