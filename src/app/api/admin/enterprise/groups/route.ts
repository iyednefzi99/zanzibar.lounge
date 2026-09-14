import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getPropertyGroups, createPropertyGroup } from "@/lib/enterprise";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await getPropertyGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, ownerEmail, restaurantIds, settings } = body;

  if (!name || !slug || !ownerEmail) {
    return NextResponse.json({ error: "name, slug, ownerEmail required" }, { status: 400 });
  }

  const group = await createPropertyGroup(name, slug, ownerEmail, restaurantIds, settings);
  return NextResponse.json(group, { status: 201 });
}
