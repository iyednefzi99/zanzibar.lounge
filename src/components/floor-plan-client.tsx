"use client";

import { useState, useEffect } from "react";

import { FloorPlan } from "./floor-plan";

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

export function FloorPlanClient({
  tables,
  reservations,
}: {
  tables: TableData[];
  reservations: ReservationData[];
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return <FloorPlan tables={tables} reservations={reservations} now={now} />;
}
