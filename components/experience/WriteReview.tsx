"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowUpRight, CircleAlert, LoaderCircle, Star, X } from "lucide-react";
import { submitReview, type GuestReviewState } from "@/app/actions";
import { containDialogFocus } from "@/lib/dialog";
import x from "./experience.module.css";
import s from "./reviews.module.css";

const ratingWords = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const initialState: GuestReviewState = {};

/**
 * The guest review form, in a dialog every "Write a review" button opens.
 * Reviews wait in the dashboard until the team approves them.
 */
export function WriteReview({
  dialog,
}: {
  dialog: RefObject<HTMLDialogElement | null>;
}) {
  const titleId = useId();
  const form = useRef<HTMLFormElement>(null);
  const thanks = useRef<HTMLHeadingElement>(null);
  const [state, formAction, pending] = useActionState(
    submitReview,
    initialState,
  );
  const errors = state.errors ?? {};
  const close = () => dialog.current?.close();

  // After sending, focus moves to the thank-you or to the first problem.
  useEffect(() => {
    if (state.sent) {
      thanks.current?.focus();
      return;
    }
    const root = form.current;
    const invalid = root?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const target =
      invalid?.getAttribute("role") === "radiogroup"
        ? invalid.querySelector<HTMLElement>("input")
        : (invalid ?? root?.querySelector<HTMLElement>('[role="alert"]'));
    target?.focus();
  }, [state]);

  return (
    <dialog
      ref={dialog}
      className={s.writeDialog}
      aria-labelledby={titleId}
      onKeyDown={containDialogFocus}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div>
        <button
          type="button"
          autoFocus
          className={`${x.iconButton} ${s.writeClose}`}
          aria-label="Close review form"
          onClick={close}
        >
          <X />
        </button>
        {state.sent ? (
          <>
            <p className={s.writeKicker}>Thank you</p>
            <h2 id={titleId} ref={thanks} tabIndex={-1}>
              Your review is <em>on its way.</em>
            </h2>
            <p className={s.writeIntro}>
              Our team reads every review before it appears on this page. Thank
              you for sharing your moment with us.
            </p>
            <button
              type="button"
              className={`${x.button} ${s.writeSubmit}`}
              onClick={close}
            >
              Close
              <X size={18} aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <p className={s.writeKicker}>Write a review</p>
            <h2 id={titleId}>
              Share your <em>moment.</em>
            </h2>
            <p className={s.writeIntro}>
              Tell us about your visit. Our team reads every review before it
              appears on this page.
            </p>
            <form
              ref={form}
              className={s.writeForm}
              action={formAction}
              noValidate
              onSubmit={(event) => {
                // Dispatching manually skips React's form reset, so the words
                // stay when something needs fixing.
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                startTransition(() => formAction(data));
              }}
            >
              {state.message && (
                <div className={s.writeAlert} role="alert" tabIndex={-1}>
                  <CircleAlert size={18} aria-hidden="true" />
                  <p>{state.message}</p>
                </div>
              )}
              <RatingInput error={errors.rating?.[0]} />
              <Field
                label="Your name"
                hint="Shown with your review. Your first name is enough."
                error={errors.author_name?.[0]}
              >
                {(field) => (
                  <input
                    {...field}
                    name="author_name"
                    className={s.writeInput}
                    maxLength={80}
                    autoComplete="given-name"
                    required
                  />
                )}
              </Field>
              <Field label="Your review" error={errors.comment?.[0]}>
                {(field) => (
                  <textarea
                    {...field}
                    name="comment"
                    className={s.writeInput}
                    rows={5}
                    maxLength={1000}
                    required
                  />
                )}
              </Field>
              {/* Left empty by people; see submitReview. */}
              <div className={s.honeypot}>
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <button
                type="submit"
                className={`${x.button} ${s.writeSubmit}`}
                disabled={pending}
              >
                {pending ? "Sending…" : "Send review"}
                {pending ? (
                  <LoaderCircle
                    size={18}
                    className={s.spin}
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowUpRight size={18} aria-hidden="true" />
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}

type FieldProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (field: FieldProps) => ReactNode;
}) {
  const id = useId();
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={s.writeField}>
      <label htmlFor={id} className={s.writeLabel}>
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p id={`${id}-hint`} className={s.writeHint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={s.writeError}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Five stars as radio buttons; a mouse previews the rating it points at. */
function RatingInput({ error }: { error?: string }) {
  const id = useId();
  const [rating, setRating] = useState(0);
  const [preview, setPreview] = useState(0);
  const shown = preview || rating;
  return (
    <div className={s.writeField}>
      <p id={`${id}-label`} className={s.writeLabel}>
        Your rating
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={s.ratingInput}
        onPointerLeave={() => setPreview(0)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setPreview(value);
            }}
          >
            <input
              type="radio"
              name="rating"
              value={value}
              checked={rating === value}
              onChange={() => setRating(value)}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
            />
            <Star
              size={30}
              strokeWidth={1.4}
              aria-hidden="true"
              data-filled={value <= shown ? "" : undefined}
            />
          </label>
        ))}
        <span className={s.ratingWord} aria-hidden="true">
          {ratingWords[shown]}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className={s.writeError}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
