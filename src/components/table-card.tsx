"use client";

type UpcomingReservation = {
  reference: string;
  name: string | null;
  time: string;
  partySize: number;
  status: string;
};

type TableStatus = "free" | "reserved" | "occupied";

type TableCardProps = {
  table: {
    id: string;
    name: string;
    capacity: number;
    zone: string;
    x: number;
    y: number;
  };
  status: TableStatus;
  selected: boolean;
  onSelect: (tableId: string) => void;
};

const STATUS_STYLES: Record<TableStatus, { fill: string; stroke: string; label: string }> = {
  free: {
    fill: "rgba(34,197,94,0.12)",
    stroke: "var(--color-lagoon)",
    label: "Libre",
  },
  reserved: {
    fill: "rgba(234,179,8,0.12)",
    stroke: "var(--color-brass)",
    label: "Réservée",
  },
  occupied: {
    fill: "rgba(239,68,68,0.12)",
    stroke: "var(--color-coral)",
    label: "Occupée",
  },
};

export function TableCard({
  table,
  status,
  selected,
  onSelect,
}: TableCardProps) {
  const styles = STATUS_STYLES[status];
  const width = 90;
  const height = 70;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Table ${table.name}, ${table.capacity} places, ${styles.label}`}
      onClick={() => onSelect(table.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(table.id);
        }
      }}
      className="cursor-pointer"
      style={{ outline: "none" }}
    >
      <rect
        x={table.x}
        y={table.y}
        width={width}
        height={height}
        rx={8}
        fill={styles.fill}
        stroke={selected ? "var(--color-shell)" : styles.stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        className="transition-all duration-150"
      />
      <text
        x={table.x + width / 2}
        y={table.y + height / 2 - 6}
        textAnchor="middle"
        fill="var(--color-shell)"
        fontSize={13}
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        {table.name}
      </text>
      <text
        x={table.x + width / 2}
        y={table.y + height / 2 + 10}
        textAnchor="middle"
        fill="var(--color-shell-dim)"
        fontSize={10}
        fontFamily="var(--font-mono)"
      >
        {table.capacity} pers.
      </text>
      <circle
        cx={table.x + width - 10}
        cy={table.y + 10}
        r={4}
        fill={styles.stroke}
      />
    </g>
  );
}

export type { UpcomingReservation, TableCardProps, TableStatus };
