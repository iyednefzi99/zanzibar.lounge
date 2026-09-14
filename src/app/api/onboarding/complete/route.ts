import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { completeRestaurantSetup } from "@/lib/onboarding/wizard";
import { getTemplateById } from "@/lib/onboarding/templates";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { tokenId, info, templateId } = body;

  if (!tokenId || !info || !templateId) {
    return NextResponse.json(
      { ok: false, error: "tokenId, info, and templateId required" },
      { status: 400 },
    );
  }

  try {
    const result = await completeRestaurantSetup(tokenId, info);

    // Apply template if not custom
    if (templateId !== "custom") {
      const template = getTemplateById(templateId);
      if (template) {
        for (const cat of template.categories) {
          await db.menuCategory.create({
            data: {
              restaurantId: result.restaurant.id,
              name: cat.name,
              sortOrder: template.categories.indexOf(cat),
              items: {
                create: cat.items.map((item, idx) => ({
                  restaurantId: result.restaurant.id,
                  name: item.name,
                  price: item.price,
                  description: item.description ?? null,
                  sortOrder: idx,
                  category: "general",
                })),
              },
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
