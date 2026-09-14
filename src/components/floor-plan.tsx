"use client";

import { useState } from "react";

import { TableCard, type TableStatus, type UpcomingReservation } from "./table-card";

type TableData = {
  id: string;
  name: string;
  capacity: number;
  zone: string;
};

type ReservationData = {
  id: string;
  reference: string;
  name: string | null;
  startsAt: string;
  endsAt: string;
  partySize: number;
  zone: string | null;
  tableId: string | null;
  status: string;
};

type FloorPlanProps = {
  tables: TableData[];
  reservations: ReservationData[];
  now: Date;
};

const ZONE_LAYOUT: Record<string, { label: string; y: number }> = {
  terrasse: { label: "Terrasse", y: 0 },
  salle: { label: "Salle", y: 260 },
  salon: { label: "Salon", y: 520 },
};

const CELL_W = 110;
const CELL_H = 100;
const PADDING_X = 20;
const HEADER_H = 40;

function positionTables(tables: TableData[]): Array<TableData & { x: number; y: number }> {
  const grouped = new Map<string, TableData[]>();
  for (const t of tables) {
    const list = grouped.get(t.zone) ?? [];
    list.push(t);
    grouped.set(t.zone, list);
  }

  const positioned: Array<TableData & { x: number; y: number }> = [];

  for (const [zone, zoneInfo] of Object.entries(ZONE_LAYOUT)) {
    const zoneTables = grouped.get(zone) ?? [];
    const cols = Math.max(1, Math.ceil(Math.sqrt(zoneTables.length * 1.5)));

    zoneTables.forEach((table, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positioned.push({
        ...table,
        x: PADDING_X + col * CELL_W,
        y: zoneInfo.y + HEADER_H + row * CELL_H,
      });
    });
  }

  return positioned;
}

function getTableStatus(
  tableId: string,
  reservations: ReservationData[],
  now: Date,
): TableStatus {
  const active = reservations.filter(
    (r) => r.tableId === tableId && r.status !== "CANCELLED" && r.status !== "NO_SHOW" && r.status !== "COMPLETED",
  );

  const nowMs = now.getTime();

  const occupied = active.some(
    (r) =>
      new Date(r.startsAt).getTime() <= nowMs &&
      new Date(r.endsAt).getTime() > nowMs,
  );
  if (occupied) return "occupied";

  const reserved = active.some(
    (r) => new Date(r.startsAt).getTime() > nowMs,
  );
  if (reserved) return "reserved";

  return "free";
}

function getUpcoming(
  tableId: string,
  reservations: ReservationData[],
  now: Date,
): UpcomingReservation[] {
  const nowMs = now.getTime();
  return reservations
    .filter(
      (r) =>
        r.tableId === tableId &&
        new Date(r.startsAt).getTime() > nowMs &&
        r.status !== "CANCELLED" &&
        r.status !== "NO_SHOW" &&
        r.status !== "COMPLETED",
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3)
    .map((r) => ({
      reference: r.reference,
      name: r.name,
      time: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Tunis",
      }).format(new Date(r.startsAt)),
      partySize: r.partySize,
      status: r.status,
    }));
}

const STATUS_COLORS: Record<TableStatus, string> = {
  free: "text-lagoon",
  reserved: "text-brass",
  occupied: "text-coral",
};

const STATUS_LABELS: Record<TableStatus, string> = {
  free: "Libre",
  reserved: "Réservée",
  occupied: "Occupée",
};

export function FloorPlan({ tables, reservations, now }: FloorPlanProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const positioned = positionTables(tables);

  const zones = Object.entries(ZONE_LAYOUT);
  const svgHeight = zones.length > 0
    ? zones[zones.length - 1][1].y + HEADER_H + 180
    : 200;

  const selectedTable = selectedId ? positioned.find((t) => t.id === selectedId) : null;
  const selectedStatus = selectedId ? getTableStatus(selectedId, reservations, now) : null;
  const selectedUpcoming = selectedId ? getUpcoming(selectedId, reservations, now) : [];

  const summary = {
    free: tables.filter((t) => getTableStatus(t.id, reservations, now) === "free").length,
    reserved: tables.filter((t) => getTableStatus(t.id, reservations, now) === "reserved").length,
    occupied: tables.filter((t) => getTableStatus(t.id, reservations, now) === "occupied").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-widest text-shell-dim/80">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-lagoon" />
          Libre ({summary.free})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-brass" />
          Réservée ({summary.reserved})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-coral" />
          Occupée ({summary.occupied})
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-shell/12 bg-deep/60 p-4">
        <svg
          viewBox={`0 0 ${PADDING_X * 2 + CELL_W * 4} ${svgHeight}`}
          width="100%"
          className="max-w-3xl"
          role="img"
          aria-label="Plan de salle"
        >
          {zones.map(([zone, zoneInfo]) => (
            <g key={zone}>
              <text
                x={PADDING_X}
                y={zoneInfo.y + 20}
                fill="var(--color-shell-dim)"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fontWeight="600"
                style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}
              >
                {zoneInfo.label}
              </text>
              <line
                x1={PADDING_X}
                y1={zoneInfo.y + HEADER_H - 8}
                x2={PADDING_X * 2 + CELL_W * 4 - 20}
                y2={zoneInfo.y + HEADER_H - 8}
                stroke="var(--color-shell)"
                strokeOpacity={0.08}
              />
            </g>
          ))}

          {positioned.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              status={getTableStatus(table.id, reservations, now)}
              selected={selectedId === table.id}
              onSelect={setSelectedId}
            />
          ))}
        </svg>
      </div>

      {selectedTable && (
        <div className="rounded-xl border border-shell/12 bg-deep/60 p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-mono text-lg text-shell">
              {selectedTable.name}
            </h3>
            <span className="font-mono text-xs uppercase tracking-widest text-shell-dim/80">
              {selectedTable.zone} · {selectedTable.capacity} places
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm font-semibold ${STATUS_COLORS[selectedStatus!]}`}
            >
              {STATUS_LABELS[selectedStatus!]}
            </span>
          </div>

          {selectedUpcoming.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80">
                Prochaines réservations
              </p>
              <ul className="space-y-1.5">
                {selectedUpcoming.map((r) => (
                  <li
                    key={r.reference}
                    className="flex items-center justify-between rounded-lg border border-shell/8 bg-deep/40 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-shell" dir="ltr">
                      {r.time}
                    </span>
                    <span className="text-shell-dim">
                      {r.name ?? "—"} · {r.partySize} pers.
                    </span>
                    <span className="font-mono text-[0.65rem] text-shell-dim">
                      {r.reference}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedUpcoming.length === 0 && (
            <p className="text-sm text-shell-dim">
              Aucune réservation à venir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
