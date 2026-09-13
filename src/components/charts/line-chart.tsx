/**
 * Graphique en ligne — server component, SVG pur.
 *
 * Pour l'évolution quotidienne des réservations. Les points manquants
 * sont affichés à 0.
 */

type LineChartProps = {
  data: Array<{ label: string; value: number }>;
  height?: number;
  lineColor?: string;
  dotColor?: string;
  labelColor?: string;
};

export function LineChart({
  data,
  height = 160,
  lineColor = "var(--color-lagoon)",
  dotColor = "var(--color-lagoon)",
  labelColor = "var(--color-shell-dim)",
}: LineChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const chartH = height - 30;
  const chartW = 500;
  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: chartH - (d.value / max) * chartH,
    value: d.value,
    label: d.label,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Surface remplie sous la courbe
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L 0 ${chartH} Z`;

  return (
    <svg
      viewBox={`0 0 ${chartW} ${height}`}
      width="100%"
      className="overflow-visible"
      aria-hidden="true"
    >
      {/* Surface */}
      <path d={areaD} fill={lineColor} opacity={0.1} />

      {/* Ligne */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={dotColor} />
          {p.value > 0 && (
            <text
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              fill={labelColor}
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {p.value}
            </text>
          )}
        </g>
      ))}

      {/* Labels (every 5th) */}
      {points.map(
        (p, i) =>
          i % Math.max(1, Math.floor(data.length / 10)) === 0 && (
            <text
              key={`label-${i}`}
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              fill={labelColor}
              fontSize={8}
              fontFamily="var(--font-mono)"
            >
              {p.label.slice(5)} {/* MM-DD */}
            </text>
          ),
      )}
    </svg>
  );
}
