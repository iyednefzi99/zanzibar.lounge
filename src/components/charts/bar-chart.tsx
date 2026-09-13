/**
 * Graphique en barres verticales — server component, SVG pur.
 *
 * Pas de lib externe : chaque barre est un `<rect>` positionné par calcul.
 * Le composant s'adapte à la largeur du parent via `width="100%"`.
 */

type BarChartProps = {
  data: Array<{ label: string; value: number }>;
  height?: number;
  barColor?: string;
  labelColor?: string;
  showValues?: boolean;
};

export function BarChart({
  data,
  height = 200,
  barColor = "var(--color-brass)",
  labelColor = "var(--color-shell-dim)",
  showValues = true,
}: BarChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, Math.floor(600 / data.length));
  const gap = Math.max(4, Math.floor(barWidth * 0.3));
  const totalWidth = data.length * (barWidth + gap) - gap;
  const chartHeight = height - 30; // espace pour les labels

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      width="100%"
      className="overflow-visible"
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const barHeight = Math.max(2, (d.value / max) * chartHeight);
        const x = i * (barWidth + gap);
        const y = chartHeight - barHeight;

        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={barColor}
              rx={3}
            />
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fill={labelColor}
                fontSize={11}
                fontFamily="var(--font-mono)"
              >
                {d.value}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fill={labelColor}
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
