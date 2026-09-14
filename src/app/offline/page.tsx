export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl">📡</p>
      <h1 className="mt-4 text-3xl font-bold">Hors ligne</h1>
      <p className="mt-2 text-shell-dim">
        Vous n&apos;avez pas de connexion internet. Veuillez vérifier votre réseau
        et réessayer.
      </p>
    </div>
  );
}
