export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-5">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
        <p className="mt-4 text-shell-dim">Chargement…</p>
      </div>
    </div>
  );
}
