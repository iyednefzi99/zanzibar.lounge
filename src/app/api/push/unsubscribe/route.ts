import { NextResponse } from "next/server";
import { z } from "zod";

import { unsubscribe } from "@/lib/push";

export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides" },
      { status: 400 },
    );
  }

  await unsubscribe(parsed.data.endpoint);

  return NextResponse.json({ ok: true });
}
