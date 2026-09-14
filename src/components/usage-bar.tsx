export function UsageBar({
  used,
  limit,
  label,
  className = "",
}: {
  used: number;
  limit: number;
  label: string;
  className?: string;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const overLimit = used > limit;

  let barColor = "bg-lagoon";
  if (overLimit || percentage >= 90) barColor = "bg-coral";
  else if (percentage >= 70) barColor = "bg-brass";

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
          {label}
        </p>
        <p className="font-mono text-sm tabular-nums text-shell" dir="ltr">
          <span className={overLimit ? "text-coral" : ""}>{used}</span>
          <span className="text-shell-dim"> / {limit === 999_999 ? "∞" : limit}</span>
        </p>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-deep">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
