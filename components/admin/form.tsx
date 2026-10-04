"use client";

import Link from "next/link";
import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import {
  Check,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Star,
} from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { HoursEditor } from "@/components/ui/HoursEditor";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MultiSelect, Select } from "@/components/ui/Select";
import { emptyFormState, type FormState } from "@/lib/form-state";
import type { WeekHours } from "@/lib/site";
import s from "./admin.module.css";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const FormStateContext = createContext<FormState>(emptyFormState);
const useFieldError = (name: string) =>
  useContext(FormStateContext).errors?.[name]?.[0];

/** Create/edit form: server-validated, with errors shown next to each field. */
export function AdminForm({
  action,
  children,
  submitLabel,
  cancelHref,
}: {
  action: Action;
  children: ReactNode;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const target =
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form.current?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [state]);

  return (
    <form
      ref={form}
      className={s.form}
      action={formAction}
      noValidate
      onSubmit={(event) => {
        // Dispatching manually skips React's automatic form reset, so typed
        // values and chosen photos survive a validation error.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <FormStateContext value={state}>
        {state.message && (
          <div className={s.alert} role="alert" tabIndex={-1}>
            <CircleAlert size={18} aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        )}
        {children}
        <div className={s.formFooter}>
          <Link href={cancelHref} className={s.buttonSecondary}>
            Cancel
          </Link>
          <button type="submit" className={s.button} disabled={pending}>
            {pending ? (
              <LoaderCircle size={17} className={s.spin} aria-hidden="true" />
            ) : (
              <Check size={17} aria-hidden="true" />
            )}
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </FormStateContext>
    </form>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${s.card} ${s.formSection}`}>
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function Fields({ children }: { children: ReactNode }) {
  return <div className={s.fields}>{children}</div>;
}

function FieldShell({
  id,
  name,
  label,
  optional,
  hint,
  wide,
  children,
}: {
  id: string;
  name: string;
  label: string;
  optional?: boolean;
  hint?: string;
  wide?: boolean;
  children: (
    describedBy: string | undefined,
    invalid: boolean,
    labelId: string,
  ) => ReactNode;
}) {
  const error = useFieldError(name);
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`${s.field} ${wide ? s.fieldWide : ""}`}>
      <label htmlFor={id} id={`${id}-label`}>
        {label}
        {optional && <span> (optional)</span>}
      </label>
      {children(describedBy, Boolean(error), `${id}-label`)}
      {hint && (
        <p id={`${id}-hint`} className={s.help}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={s.error}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  optional?: boolean;
  hint?: string;
  wide?: boolean;
};

export function TextField({
  name,
  label,
  optional,
  hint,
  wide,
  ...input
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell {...{ id, name, label, optional, hint, wide }}>
      {(describedBy, invalid) => (
        <input
          id={id}
          name={name}
          className={s.input}
          required={!optional}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          {...input}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  optional,
  hint,
  wide,
  ...textarea
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell {...{ id, name, label, optional, hint, wide }}>
      {(describedBy, invalid) => (
        <textarea
          id={id}
          name={name}
          className={s.textarea}
          required={!optional}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          {...textarea}
        />
      )}
    </FieldShell>
  );
}

/** Dropdown field built on the shared Select component. */
export function SelectField({
  name,
  label,
  optional,
  hint,
  wide,
  ...select
}: FieldProps &
  Omit<
    ComponentProps<typeof Select>,
    "name" | "id" | "labelledBy" | "label" | "invalid" | "describedBy"
  >) {
  const id = useId();
  return (
    <FieldShell {...{ id, name, label, optional, hint, wide }}>
      {(describedBy, invalid, labelId) => (
        <Select
          id={id}
          name={name}
          labelledBy={labelId}
          invalid={invalid}
          describedBy={describedBy}
          {...select}
        />
      )}
    </FieldShell>
  );
}

/** Pick one or several options; each pick is submitted under `name`. */
export function MultiSelectField({
  name,
  label,
  optional,
  hint,
  wide,
  ...select
}: FieldProps &
  Omit<
    ComponentProps<typeof MultiSelect>,
    "name" | "id" | "labelledBy" | "label" | "invalid" | "describedBy"
  >) {
  const id = useId();
  return (
    <FieldShell {...{ id, name, label, optional, hint, wide }}>
      {(describedBy, invalid, labelId) => (
        <MultiSelect
          id={id}
          name={name}
          labelledBy={labelId}
          invalid={invalid}
          describedBy={describedBy}
          {...select}
        />
      )}
    </FieldShell>
  );
}

/** Calendar date field; submits an ISO date such as 2026-10-03. */
export function DateField({
  name,
  label,
  optional,
  hint,
  wide,
  ...picker
}: FieldProps &
  Omit<
    ComponentProps<typeof DatePicker>,
    "name" | "id" | "labelledBy" | "label" | "invalid" | "describedBy"
  >) {
  const id = useId();
  return (
    <FieldShell {...{ id, name, label, optional, hint, wide }}>
      {(describedBy, invalid, labelId) => (
        <DatePicker
          id={id}
          name={name}
          labelledBy={labelId}
          invalid={invalid}
          describedBy={describedBy}
          clearable={optional}
          {...picker}
        />
      )}
    </FieldShell>
  );
}

/** Phone with a country picker; submits the number as +212… */
export function PhoneField({
  name,
  label,
  optional,
  hint,
  wide,
  defaultValue,
}: FieldProps & { defaultValue?: string }) {
  const id = useId();
  return (
    <FieldShell {...{ id, name, label, optional, hint, wide }}>
      {(describedBy, invalid, labelId) => (
        <PhoneInput
          id={id}
          name={name}
          labelledBy={labelId}
          describedBy={describedBy}
          invalid={invalid}
          defaultValue={defaultValue}
        />
      )}
    </FieldShell>
  );
}

/** Weekly opening hours, edited day by day like Google Maps. */
export function HoursField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: WeekHours | null;
}) {
  const id = useId();
  const error = useFieldError(name);
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`${s.field} ${s.fieldWide}`}>
      <span id={`${id}-label`} className={s.fieldLabel}>
        {label}
      </span>
      {hint && (
        <p id={`${id}-hint`} className={s.help}>
          {hint}
        </p>
      )}
      <HoursEditor
        name={name}
        defaultValue={defaultValue}
        labelledBy={`${id}-label`}
        describedBy={describedBy}
      />
      {error && (
        <p id={`${id}-error`} className={s.error}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** A checkbox that looks like a switch; unchecked boxes send nothing. */
export function ToggleField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className={s.toggleRow}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className={s.switchTrack} aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}

export function Toggles({ children }: { children: ReactNode }) {
  return <div className={s.toggles}>{children}</div>;
}

export function IconChoiceField({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: {
    value: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
  }[];
  defaultValue: string;
}) {
  const error = useFieldError(name);
  return (
    <fieldset className={s.iconChoices} aria-invalid={error ? true : undefined}>
      <legend>{legend}</legend>
      {options.map(({ value, label, icon: Icon }) => (
        <label key={value} className={s.iconChoice}>
          <input
            type="radio"
            name={name}
            value={value}
            defaultChecked={value === defaultValue}
          />
          <span>
            <Icon size={22} />
            {label}
          </span>
        </label>
      ))}
      {error && (
        <p className={s.error}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function RatingField({ defaultValue }: { defaultValue: number }) {
  const error = useFieldError("rating");
  const [rating, setRating] = useState(defaultValue);
  return (
    <fieldset
      className={s.ratingChoices}
      aria-invalid={error ? true : undefined}
    >
      <legend>Rating</legend>
      {[1, 2, 3, 4, 5].map((value) => (
        <label key={value}>
          <input
            type="radio"
            name="rating"
            value={value}
            checked={rating === value}
            onChange={() => setRating(value)}
            aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
          />
          <span aria-hidden="true">
            <Star size={20} data-filled={value <= rating} />
          </span>
        </label>
      ))}
      {error && (
        <p className={s.error}>
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

const acceptedImages = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Photo upload with an instant preview; the file is sent with the form. */
export function ImageField({
  label,
  current,
  hint = "JPG, PNG, WebP or AVIF, up to 5 MB. Transparent PNG or WebP cutouts look best.",
}: {
  label: string;
  current: string | null;
  hint?: string;
}) {
  const id = useId();
  const serverError = useFieldError("image");
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const error = localError ?? serverError;
  const shown = preview ?? (removed ? null : current);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  return (
    <div className={s.field}>
      <span className={s.fieldLabel} id={`${id}-label`}>
        {label} <span>(optional)</span>
      </span>
      <div className={s.imageField}>
        <div className={s.imagePreview}>
          {shown ? (
            // Local previews are blob: URLs, which next/image can't optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" />
          ) : (
            <ImagePlus size={28} aria-hidden="true" />
          )}
        </div>
        <div className={s.imageControls}>
          <input
            id={id}
            type="file"
            name="image"
            accept={acceptedImages.join(",")}
            className={s.fileInput}
            aria-labelledby={`${id}-label`}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              setLocalError(null);
              setPreview(null);
              if (!file) return;
              const problem = !acceptedImages.includes(file.type)
                ? "Use a JPG, PNG, WebP or AVIF image."
                : file.size > 5 * 1024 * 1024
                  ? "Images must be 5 MB or smaller."
                  : null;
              if (problem) {
                setLocalError(problem);
                input.value = "";
                return;
              }
              setPreview(URL.createObjectURL(file));
              setRemoved(false);
            }}
          />
          {current && !preview && (
            <label className={s.checkbox}>
              <input
                type="checkbox"
                name="remove_image"
                checked={removed}
                onChange={(event) => setRemoved(event.target.checked)}
              />
              Remove current photo
            </label>
          )}
          <p id={`${id}-hint`} className={s.help}>
            {hint}
          </p>
          {error && (
            <p id={`${id}-error`} className={s.error}>
              <CircleAlert size={14} aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
