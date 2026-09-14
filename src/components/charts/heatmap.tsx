/**
 * Heatmap chart component — 7×24 grid showing reservation density.
 *
 * Color scale: shell-dim → brass → coral based on count intensity.
 * Server component, pure SVG/CSS.
 */

type HeatmapProps = {
  data: Array<{
    dayOfWeek: number;
    hour: number;
    count: number;
  }>;
  label?: string;
};

function getColor(count: number, max: number): string {
  if (count === 0) return "var(--color-shell-dim)";
  if (max === 0) return "var(--color-shell-dim)";

  const ratio = count / max;

  if (ratio < 0.25) return "color-mix(in srgb, var(--color-shell-dim) 70%, var(--color-brass))";
  if (ratio < 0.5) return "var(--color-brass)";
  if (ratio < 0.75) return "color-mix(in srgb, var(--color-brass) 60%, var(--color-coral))";
  return "var(--color-coral)";
}

function getOpacity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0.15;
  return 0.3 + (count / max) * 0.7;
}

const SHORT_HOURS = Array.from({ length: 24 }, (_, i) =>
  i % 3 === 0 ? `${String(i).padStart(2, "0")}h` : "",
);

const SHORT_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function Heatmap({ data, label }: HeatmapProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);

  const cellW = 28;
  const cellH = 28;
  const labelW = 36;
  const hourLabelH = 20;
  const gap = 2;

  const gridW = labelW + 24 * (cellW + gap);
  const gridH = hourLabelH + 7 * (cellH + gap);

  // Build lookup for quick access
  const lookup = new Map<string, number>();
  for (const d of data) {
    lookup.set(`${d.dayOfWeek}-${d.hour}`, d.count);
  }

  return (
    <div className="overflow-x-auto">
      {label && (
        <h3 className="mb-3 font-mono text-sm uppercase tracking-[0.18em] text-shell-dim/80">
          {label}
        </h3>
      )}
      <svg
        viewBox={`0 0 ${gridW} ${gridH}`}
        width="100%"
        className="max-w-[800px] overflow-visible"
        aria-label="Carte de chaleur des réservations"
        role="img"
      >
        {/* Hour labels (top) */}
        {SHORT_HOURS.map((label, i) => (
          <text
            key={`h-${i}`}
            x={labelW + i * (cellW + gap) + cellW / 2}
            y={hourLabelH - 4}
            textAnchor="middle"
            fill="var(--color-shell-dim)"
            fontSize={9}
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        ))}

        {/* Day labels (left) */}
        {SHORT_DAYS.map((day, i) => (
          <text
            key={`d-${i}`}
            x={labelW - 6}
            y={hourLabelH + i * (cellH + gap) + cellH / 2 + 3}
            textAnchor="end"
            fill="var(--color-shell-dim)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {day}
          </text>
        ))}

        {/* Cells */}
        {Array.from({ length: 7 }).map((_, day) =>
          Array.from({ length: 24 }).map((_, hour) => {
            const count = lookup.get(`${day}-${hour}`) ?? 0;
            const x = labelW + hour * (cellW + gap);
            const y = hourLabelH + day * (cellH + gap);
            const color = getColor(count, max);
            const opacity = getOpacity(count, max);

            return (
              <g key={`${day}-${hour}`}>
                <rect
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  fill={color}
                  opacity={opacity}
                  rx={3}
                  className="transition-opacity hover:opacity-100"
                >
                  <title>
                    {SHORT_DAYS[day]} {String(hour).padStart(2, "0")}:00 —{" "}
                    {count} réservation{count !== 1 ? "s" : ""}
                  </title>
                </rect>
                {count > 0 && (
                  <text
                    x={x + cellW / 2}
                    y={y + cellH / 2 + 3}
                    textAnchor="middle"
                    fill="var(--color-shell)"
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    pointerEvents="none"
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
