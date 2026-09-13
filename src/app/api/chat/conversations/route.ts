import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getOpenConversations, getConversationMessages } from "@/lib/chat";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/conversations — Liste des conversations ouvertes.
 * GET /api/chat/conversations?id=xxx — Messages d'une conversation.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const messages = await getConversationMessages(id);
    return NextResponse.json(messages);
  }

  const conversations = await getOpenConversations();
  return NextResponse.json(conversations);
}
