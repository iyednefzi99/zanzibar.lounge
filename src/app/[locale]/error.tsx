"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl font-bold text-coral">!</p>
      <h1 className="mt-4 text-3xl font-bold">Une erreur s&apos;est produite</h1>
      <p className="mt-2 text-shell-dim">
        Nous avons été informés du problème. Réessayez dans quelques instants.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded bg-brass px-6 py-3 font-medium text-night transition hover:bg-brass/80"
      >
        Réessayer
      </button>
    </div>
  );
}
