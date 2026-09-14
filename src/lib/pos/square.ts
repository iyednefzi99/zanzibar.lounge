import type { PosSyncResult } from "./index";
import { updateSyncStatus, logSync } from "./index";
import { db } from "@/lib/db";

type SquareCatalogItem = {
  id: string;
  item_data?: {
    name?: string;
    description?: string;
    category_id?: string;
    variations?: Array<{
      item_variation_data?: {
        name?: string;
        price_money?: { amount?: bigint; currency?: string };
      };
    }>;
  };
};

export class SquareClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(accessToken: string) {
    this.baseUrl = "https://connect.squareup.com/v2";
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async fetchCatalog(): Promise<SquareCatalogItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/list?types=ITEM`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error(`Square API error: ${response.status}`);
      const data = await response.json();
      return (data as { objects?: SquareCatalogItem[] }).objects ?? [];
    } catch (error) {
      throw new Error(`Failed to fetch Square catalog: ${error}`);
    }
  }

  static async syncMenu(integrationId: string, restaurantId: string): Promise<PosSyncResult> {
    const integration = await db.posIntegration.findUnique({ where: { id: integrationId } });
    if (!integration?.apiKey) return { success: false, synced: 0, errors: ["No API key"] };

    await updateSyncStatus(integrationId, "syncing");

    try {
      const client = new SquareClient(integration.apiKey);
      const items = await client.fetchCatalog();

      let synced = 0;
      const errors: string[] = [];

      for (const item of items) {
        const data = item.item_data;
        if (!data?.name) continue;

        try {
          const variation = data.variations?.[0]?.item_variation_data;
          const price = variation?.price_money?.amount
            ? Number(variation.price_money.amount) * 10 // Convert cents to millimes
            : 0;

          await db.menuItem.upsert({
            where: { restaurantId_name: { restaurantId, name: data.name } },
            create: {
              restaurantId,
              name: data.name,
              description: data.description,
              price,
              category: "general",
            },
            update: {
              description: data.description,
              price,
            },
          });
          synced++;
        } catch (err) {
          errors.push(`Failed to sync item ${data.name}: ${err}`);
        }
      }

      await updateSyncStatus(integrationId, "idle");
      await logSync(integrationId, "import", "menu", errors.length === 0 ? "success" : "error", {
        synced,
        errors: errors.slice(0, 10),
      });

      return { success: true, synced, errors };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      await updateSyncStatus(integrationId, "error", msg);
      await logSync(integrationId, "import", "menu", "error", { error: msg });
      return { success: false, synced: 0, errors: [msg] };
    }
  }
}
