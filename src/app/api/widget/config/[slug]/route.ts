import { NextResponse } from "next/server";

import { getWidgetConfigResponse } from "@/lib/widget-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const config = await getWidgetConfigResponse(slug);
  if (!config) {
    return NextResponse.json(
      { error: "restaurant_not_found" },
      { status: 404 },
    );
  }

  const response = NextResponse.json(config);

  // Cache 1h pour les widgets (les thèmes changent rarement)
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );

  return response;
}
