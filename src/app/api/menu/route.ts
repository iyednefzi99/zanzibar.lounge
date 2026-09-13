import { NextResponse } from "next/server";

import { getMenu } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/menu — Articles du menu disponibles.
 */
export async function GET() {
  const menu = await getMenu();
  return NextResponse.json(menu);
}
