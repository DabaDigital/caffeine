"use client";

import { startTransition, useActionState } from "react";
import { CircleAlert, LoaderCircle, LogIn } from "lucide-react";
import { emptyFormState } from "@/lib/form-state";
import s from "@/components/admin/admin.module.css";
import { signIn } from "./actions";

export function LoginForm({
  next,
  notice,
}: {
  next?: string;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, emptyFormState);
  const message = state.message ?? notice;
  const emailError = state.errors?.email?.[0];
  const passwordError = state.errors?.password?.[0];

  return (
    <form
      action={formAction}
      className={s.form}
      noValidate
      onSubmit={(event) => {
        // Keep the typed email if sign-in fails (form actions reset fields).
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {message && (
        <div className={s.alert} role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <p>{message}</p>
        </div>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <div className={s.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={s.input}
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <p id="email-error" className={s.error}>
            {emailError}
          </p>
        )}
      </div>
      <div className={s.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={s.input}
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError && (
          <p id="password-error" className={s.error}>
            {passwordError}
          </p>
        )}
      </div>
      <button type="submit" className={s.button} disabled={pending}>
        {pending ? (
          <LoaderCircle size={17} className={s.spin} aria-hidden="true" />
        ) : (
          <LogIn size={17} aria-hidden="true" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
