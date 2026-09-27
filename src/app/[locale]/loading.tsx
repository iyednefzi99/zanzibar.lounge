export default function LocaleLoading() {
  return (
    <div className="mx-auto flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
        <p className="font-mono text-sm text-shell-dim">Chargement...</p>
      </div>
    </div>
  );
}
