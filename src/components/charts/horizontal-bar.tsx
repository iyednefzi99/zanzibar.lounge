/**
 * Graphique en barres horizontales — server component, SVG pur.
 *
 * Utile pour le taux de remplissage par zone : les labels sont lisibles
 * sans rotation.
 */

type HorizontalBarProps = {
  data: Array<{ label: string; value: number; max: number }>;
  height?: number;
  barColor?: string;
  trackColor?: string;
  labelColor?: string;
};

export function HorizontalBar({
  data,
  height = 40,
  barColor = "var(--color-brass)",
  trackColor = "var(--color-shell)",
  labelColor = "var(--color-shell-dim)",
}: HorizontalBarProps) {
  if (data.length === 0) return null;

  const rowHeight = height + 28;
  const totalHeight = data.length * rowHeight;

  return (
    <svg
      viewBox={`0 0 500 ${totalHeight}`}
      width="100%"
      className="overflow-visible"
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const y = i * rowHeight;
        const pct = d.max > 0 ? d.value / d.max : 0;
        const barW = Math.max(2, pct * 300);

        return (
          <g key={d.label}>
            <text
              x={0}
              y={y + 6}
              fill={labelColor}
              fontSize={12}
              fontFamily="var(--font-mono)"
            >
              {d.label}
            </text>
            <rect
              x={90}
              y={y}
              width={300}
              height={height}
              fill={trackColor}
              opacity={0.12}
              rx={4}
            />
            <rect
              x={90}
              y={y}
              width={barW}
              height={height}
              fill={barColor}
              rx={4}
            />
            <text
              x={90 + barW + 8}
              y={y + height / 2 + 4}
              fill={labelColor}
              fontSize={12}
              fontFamily="var(--font-mono)"
            >
              {Math.round(pct * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
