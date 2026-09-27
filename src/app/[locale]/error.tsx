"use client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-6xl text-coral">!</p>
      <h1 className="mt-4 font-display text-3xl text-shell">
        Une erreur est survenue
      </h1>
      <p className="mt-2 max-w-md text-shell-dim">
        {error.message || "Une erreur inattendue s'est produite."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/90"
      >
        Réessayer
      </button>
    </div>
  );
}
