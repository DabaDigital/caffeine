"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useActionState,
  useId,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import {
  Check,
  CircleAlert,
  LoaderCircle,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { emptyFormState, type FormState } from "@/lib/form-state";
import { containDialogFocus } from "@/lib/dialog";
import s from "./admin.module.css";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Delete with a confirmation dialog; errors (e.g. "still in use") show inline. */
export function DeleteButton({
  action,
  id,
  name,
  what,
  variant = "icon",
  consequence = "It will disappear from the dashboard and the homepage.",
}: {
  action: Action;
  id: string;
  name: string;
  what: string;
  variant?: "icon" | "button";
  consequence?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const open = () => dialog.current?.showModal();
  const close = () => dialog.current?.close();

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          className={`${s.iconButton} ${s.iconButtonDanger}`}
          aria-label={`Delete ${name}`}
          onClick={open}
        >
          <Trash2 size={17} />
        </button>
      ) : (
        <button type="button" className={s.buttonDanger} onClick={open}>
          <Trash2 size={16} aria-hidden="true" /> Delete {what}
        </button>
      )}
      <dialog
        ref={dialog}
        className={s.dialog}
        aria-labelledby={titleId}
        onKeyDown={containDialogFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div>
          <div className={s.dialogIcon} aria-hidden="true">
            <Trash2 size={22} />
          </div>
          <h2 id={titleId}>Delete this {what}?</h2>
          <p>
            “{name}” will be permanently deleted. {consequence}
          </p>
          {state.message && (
            <div className={s.alert} role="alert">
              <CircleAlert size={18} aria-hidden="true" />
              <p>{state.message}</p>
            </div>
          )}
          <form action={formAction} className={s.dialogActions}>
            <input type="hidden" name="id" value={id} />
            <button
              type="button"
              className={s.buttonSecondary}
              onClick={close}
              autoFocus
            >
              Keep it
            </button>
            <button type="submit" className={s.buttonDanger} disabled={pending}>
              {pending ? (
                <LoaderCircle size={16} className={s.spin} aria-hidden="true" />
              ) : (
                <Trash2 size={16} aria-hidden="true" />
              )}
              {pending ? "Deleting…" : "Delete"}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

/** On/off switch in a list row, updated optimistically. */
export function ToggleSwitch({
  action,
  id,
  field,
  checked,
  label,
  states,
}: {
  action: Action;
  id: string;
  field: string;
  checked: boolean;
  label: string;
  /** Words shown beside the switch when on and off, e.g. Published, Hidden. */
  states?: [on: string, off: string];
}) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const [optimistic, setOptimistic] = useOptimistic(checked);
  return (
    <form
      action={(formData) => {
        setOptimistic(!checked);
        formAction(formData);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!checked)} />
      <button
        type="submit"
        role="switch"
        aria-checked={optimistic}
        aria-label={label}
        className={s.switch}
        disabled={pending}
      >
        <span className={s.switchTrack} aria-hidden="true" />
        {/* The switch already announces its state. */}
        {states && (
          <span aria-hidden="true">{optimistic ? states[0] : states[1]}</span>
        )}
      </button>
      {state.message && (
        <span className={s.switchError} role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}

export function RoleButton({
  action,
  userId,
  role,
  name,
}: {
  action: Action;
  userId: string;
  role: "admin" | "user";
  name: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const promote = role !== "admin";
  return (
    <form
      action={formAction}
      className={s.actions}
      style={{ flexWrap: "wrap" }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={promote ? "admin" : "user"} />
      <button
        type="submit"
        className={promote ? s.button : s.buttonSecondary}
        disabled={pending}
        aria-label={`${promote ? "Make" : "Remove"} ${name} ${promote ? "an admin" : "as admin"}`}
      >
        {pending ? (
          <LoaderCircle size={16} className={s.spin} aria-hidden="true" />
        ) : promote ? (
          <ShieldCheck size={16} aria-hidden="true" />
        ) : (
          <ShieldOff size={16} aria-hidden="true" />
        )}
        {promote ? "Make admin" : "Remove admin"}
      </button>
      {state.message && (
        <span className={s.switchError} role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}

/** Approve (publish) or decline a review a guest wrote on the homepage. */
export function ReviewDecision({
  action,
  id,
  name,
  declined = false,
}: {
  action: Action;
  id: string;
  /** The guest's name, so every review's buttons have their own names. */
  name: string;
  /** A declined review can still be approved. */
  declined?: boolean;
}) {
  const [state, formAction] = useActionState(action, emptyFormState);
  return (
    <form action={formAction} className={s.decision}>
      <input type="hidden" name="id" value={id} />
      {state.message && (
        <span className={s.switchError} role="alert">
          {state.message}
        </span>
      )}
      {!declined && <DecisionButton decision="decline" name={name} />}
      <DecisionButton decision="approve" name={name} />
    </form>
  );
}

function DecisionButton({
  decision,
  name,
}: {
  decision: "approve" | "decline";
  name: string;
}) {
  // Both buttons wait while either is sending; the one pressed spins.
  const { pending, data } = useFormStatus();
  const busy = pending && data?.get("decision") === decision;
  const approve = decision === "approve";
  const Icon = busy ? LoaderCircle : approve ? Check : X;
  return (
    <button
      type="submit"
      name="decision"
      value={decision}
      className={approve ? s.button : s.buttonSecondary}
      disabled={pending}
    >
      <Icon
        size={16}
        className={busy ? s.spin : undefined}
        aria-hidden="true"
      />
      {approve ? "Approve" : "Decline"}
      <span className="sr-only"> the review by {name}</span>
    </button>
  );
}

/** Search and filter controls that update the URL, so results can be shared. */
export function ListFilters({
  search,
  filter,
  shown,
  total,
}: {
  search?: { value: string; label: string };
  filter?: {
    name: string;
    value: string;
    label: string;
    options: SelectOption[];
  };
  shown: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(search?.value ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.delete("notice");
    params.delete("n");
    params.delete("page");
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      }),
    );
  }

  return (
    <div className={s.toolbar} role="search">
      {search && (
        <div className={s.search}>
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            className={s.input}
            placeholder={search.label}
            aria-label={search.label}
            value={text}
            onChange={(event) => {
              const value = event.target.value;
              setText(value);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => update("q", value.trim()), 300);
            }}
          />
        </div>
      )}
      {filter && (
        <div className={s.filter}>
          <Select
            label={filter.label}
            options={filter.options}
            defaultValue={filter.value}
            onChange={(value) => update(filter.name, value)}
          />
        </div>
      )}
      <span className={s.count} aria-live="polite">
        {pending ? (
          <LoaderCircle size={16} className={s.spin} aria-label="Updating" />
        ) : shown === total ? (
          `${total} total`
        ) : (
          `${shown} of ${total}`
        )}
      </span>
    </div>
  );
}
