import type { Dictionary } from "@/i18n";

export function OpenBadge({
  className,
}: {
  dictionary?: Dictionary;
  className?: string;
}) {
  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= 8 && hour < 24;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-lagoon animate-pulse" : "bg-coral"}`}
      />
      <span className={isOpen ? "text-lagoon" : "text-coral"}>
        {isOpen ? "OPEN" : "CLOSED"}
      </span>
      {isOpen && (
        <span className="text-shell-dim/50">UNTIL 00:00</span>
      )}
    </span>
  );
}
