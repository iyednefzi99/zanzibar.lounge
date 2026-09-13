/**
 * Graphique donut — server component, SVG pur.
 *
 * Pour la répartition par canal. Chaque segment est un arc SVG calculé
 * avec des coordonnées polaires.
 */

type DonutChartProps = {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  labelColor?: string;
};

export function DonutChart({
  data,
  size = 180,
  labelColor = "var(--color-shell-dim)",
}: DonutChartProps) {
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.55;

  const segments = data.reduce<{
    acc: number;
    result: Array<{ label: string; value: number; color: string; startAngle: number; endAngle: number; pct: number }>;
  }>(
    (state, d) => {
      const startAngle = (state.acc / total) * Math.PI * 2 - Math.PI / 2;
      const newAcc = state.acc + d.value;
      const endAngle = (newAcc / total) * Math.PI * 2 - Math.PI / 2;
      return {
        acc: newAcc,
        result: [...state.result, { ...d, startAngle, endAngle, pct: d.value / total }],
      };
    },
    { acc: 0, result: [] },
  ).result;

  return (
    <div className="flex items-center gap-6">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden="true"
      >
        {segments.map((seg, i) => {
          const largeArc = seg.endAngle - seg.startAngle > Math.PI ? 1 : 0;
          const x1o = cx + outerR * Math.cos(seg.startAngle);
          const y1o = cy + outerR * Math.sin(seg.startAngle);
          const x2o = cx + outerR * Math.cos(seg.endAngle);
          const y2o = cy + outerR * Math.sin(seg.endAngle);
          const x1i = cx + innerR * Math.cos(seg.endAngle);
          const y1i = cy + innerR * Math.sin(seg.endAngle);
          const x2i = cx + innerR * Math.cos(seg.startAngle);
          const y2i = cy + innerR * Math.sin(seg.startAngle);

          const path = [
            `M ${x1o} ${y1o}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
            `L ${x1i} ${y1i}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
            "Z",
          ].join(" ");

          return <path key={i} d={path} fill={seg.color} />;
        })}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={labelColor}
          fontSize={20}
          fontFamily="var(--font-mono)"
          fontWeight="bold"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill={labelColor}
          fontSize={10}
          fontFamily="var(--font-mono)"
        >
          total
        </text>
      </svg>

      <ul className="space-y-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="inline-block size-3 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-sm text-shell-dim">{seg.label}</span>
            <span className="font-mono text-xs text-shell-dim/70">
              {seg.value} ({Math.round(seg.pct * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
