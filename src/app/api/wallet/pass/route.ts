import { NextRequest, NextResponse } from "next/server";
import { generateAppleWalletPass, generatePassHtml } from "@/lib/wallet/apple-pass";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const restaurantId = request.nextUrl.searchParams.get("restaurantId");
  const reservationId = request.nextUrl.searchParams.get("reservationId");

  if (!restaurantId || !reservationId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId and reservationId required" },
      { status: 400 },
    );
  }

  const passData = await generateAppleWalletPass(restaurantId, reservationId);
  if (!passData) {
    return NextResponse.json({ ok: false, error: "Reservation not found" }, { status: 404 });
  }

  const html = generatePassHtml(passData);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
