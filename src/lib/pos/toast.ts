import type { PosSyncResult } from "./index";
import { updateSyncStatus, logSync } from "./index";
import { db } from "@/lib/db";

type ToastMenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  group_name?: string;
  tax_rate?: number;
  sku?: string;
};

type ToastOrder = {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: Array<{ name: string; quantity: number; price: number }>;
};

export class ToastClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(apiKey: string, locationId?: string) {
    this.baseUrl = "https://ws-api.toasttab.com/consumer-app-bff/v1";
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    void locationId;
  }

  async fetchMenu(): Promise<ToastMenuItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/menus`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error(`Toast API error: ${response.status}`);
      const data = await response.json();
      return (data as { menus?: Array<{ menuGroups?: Array<{ menuItems?: ToastMenuItem[] }> }> })
        .menus?.flatMap((m) => m.menuGroups?.flatMap((g) => g.menuItems ?? []) ?? []) ?? [];
    } catch (error) {
      throw new Error(`Failed to fetch Toast menu: ${error}`);
    }
  }

  async fetchOrders(since?: Date): Promise<ToastOrder[]> {
    try {
      const params = since ? `?created=${since.toISOString()}` : "";
      const response = await fetch(`${this.baseUrl}/orders${params}`, {
        headers: this.headers,
      });
      if (!response.ok) throw new Error(`Toast API error: ${response.status}`);
      const data = await response.json();
      return (data as { orders?: ToastOrder[] }).orders ?? [];
    } catch (error) {
      throw new Error(`Failed to fetch Toast orders: ${error}`);
    }
  }

  static async syncMenu(integrationId: string, restaurantId: string): Promise<PosSyncResult> {
    const integration = await db.posIntegration.findUnique({ where: { id: integrationId } });
    if (!integration?.apiKey) return { success: false, synced: 0, errors: ["No API key"] };

    await updateSyncStatus(integrationId, "syncing");

    try {
      const client = new ToastClient(integration.apiKey, integration.locationId ?? undefined);
      const toastItems = await client.fetchMenu();

      let synced = 0;
      const errors: string[] = [];

      for (const item of toastItems) {
        try {
          const price = Math.round(item.price * 1000); // Convert to millimes
          await db.menuItem.upsert({
            where: { restaurantId_name: { restaurantId, name: item.name } },
            create: {
              restaurantId,
              name: item.name,
              description: item.description,
              price,
              category: item.group_name ?? "general",
            },
            update: {
              description: item.description,
              price,
              category: item.group_name ?? "general",
            },
          });
          synced++;
        } catch (err) {
          errors.push(`Failed to sync item ${item.name}: ${err}`);
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
