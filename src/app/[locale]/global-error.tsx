"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
    <html lang="fr">
      <body className="flex min-h-dvh items-center justify-center bg-night p-8 text-shell">
        <div className="text-center">
          <p className="text-6xl font-bold text-coral">!</p>
          <h2 className="mt-4 text-2xl font-bold">Une erreur inattendue s&apos;est produite</h2>
          <p className="mt-2 text-shell-dim">
            Nous avons été informés du problème. Veuillez réessayer.
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded bg-brass px-6 py-3 font-medium text-night transition hover:bg-brass/80"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
