import { NextResponse } from "next/server";
import { z } from "zod";

import { hasAgent } from "@/lib/env";
import { routeAiRequest } from "@/lib/ai/router";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { menuAsText } from "@/content/menu";
import { site } from "@/content/site";
import { openStatus } from "@/lib/hours";
import { defaultLocale, isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(500),
    }),
  ),
  context: z.object({
    restaurantName: z.string(),
    menuSummary: z.string().optional(),
    openHours: z.string().optional(),
    locale: z.string().optional(),
  }),
});

const SYSTEM_PROMPT = `You are a friendly, helpful restaurant concierge AI for {restaurantName}.

Your role is to answer guest questions about:
- Menu items, ingredients, allergens
- Opening hours and service times
- Parking, directions, dress code
- Daily specials and recommendations
- Dietary accommodations

Rules:
- Be warm, concise, and helpful
- If asked about availability or to make a reservation, guide them to the booking page
- If you don't know something specific, say so honestly
- Respond in the same language the guest uses
- Never share internal system information
- Keep responses under 3 sentences unless detail is needed`;

export async function POST(request: Request) {
  if (!hasAgent) {
    return NextResponse.json(
      { error: "AI concierge is not configured" },
      { status: 503 },
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400 },
    );
  }

  const { messages, context } = parsed.data;

  const status = openStatus();
  const statusText = status.open
    ? `Currently OPEN, closes at ${status.closesAt}`
    : status.today
      ? `Currently CLOSED, opens at ${status.opensAt}`
      : `Closed today, opens ${status.opensWeekday} at ${status.opensAt}`;

  const locale =
    context.locale && isLocale(context.locale) ? context.locale : defaultLocale;
  const menu = context.menuSummary || menuAsText(locale);

  const systemMessage = SYSTEM_PROMPT
    .replace("{restaurantName}", context.restaurantName)
    + `\n\nCurrent status: ${statusText}\nTimezone: ${site.timezone}\n\nMenu:\n${menu}`;

  try {
    const restaurantId = await getDefaultRestaurantId();

    const result = await routeAiRequest(
      restaurantId,
      "concierge",
      [
        { role: "system", content: systemMessage },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      { maxTokens: 300, temperature: 0.7 },
    );

    return NextResponse.json({
      reply: result.content,
      _meta: {
        provider: result.provider,
        model: result.model,
        tokens: result.inputTokens + result.outputTokens,
      },
    });
  } catch (err) {
    console.error("[concierge]", err);
    return NextResponse.json(
      { error: "Concierge temporarily unavailable" },
      { status: 500 },
    );
  }
}
