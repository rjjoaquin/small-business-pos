"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions";

const initial: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label htmlFor="pin" className="text-sm font-medium">
        PIN
      </label>
      <input
        id="pin"
        name="pin"
        type="password"
        autoFocus
        autoComplete="current-password"
        required
        minLength={8}
        maxLength={128}
        className="rounded-lg border border-line bg-panel px-3 py-3"
      />
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
