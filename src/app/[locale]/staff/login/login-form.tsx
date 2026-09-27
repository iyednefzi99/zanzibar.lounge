"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { loginAction } from "../actions";

export function StaffLoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: { error: string } | null, formData: FormData) => {
      const result = await loginAction(prev, formData);
      if (!result) {
        router.push(`/${locale}/staff`);
        router.refresh();
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="staff-email"
          className="block font-mono text-xs uppercase tracking-wider text-shell-dim"
        >
          Email
        </label>
        <input
          id="staff-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-2 block h-12 w-full rounded-md border border-shell/20 bg-deep/60 px-4 text-shell placeholder-shell-dim/40 outline-none transition-colors focus:border-brass"
        />
      </div>
      <div>
        <label
          htmlFor="staff-password"
          className="block font-mono text-xs uppercase tracking-wider text-shell-dim"
        >
          Mot de passe
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 block h-12 w-full rounded-md border border-shell/20 bg-deep/60 px-4 text-shell placeholder-shell-dim/40 outline-none transition-colors focus:border-brass"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md bg-coral/10 px-4 py-3 text-center text-sm text-coral"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-sm bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90 disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
