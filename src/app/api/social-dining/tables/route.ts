import { NextResponse } from "next/server";
import { getSocialTables, createSocialTable } from "@/lib/social-dining";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date") ?? undefined;

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  const tables = await getSocialTables(restaurantId, date ?? undefined);
  return NextResponse.json({ tables });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { restaurantId, ...tableData } = body;

  if (!restaurantId || !tableData.name || !tableData.totalSeats) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const table = await createSocialTable(restaurantId, tableData);
  return NextResponse.json({ table }, { status: 201 });
}
