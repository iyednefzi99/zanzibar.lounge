import type { PosSyncResult } from "./index";
import { updateSyncStatus, logSync, getPosIntegration } from "./index";
import { ToastClient } from "./toast";
import { SquareClient } from "./square";
import type { PosProvider } from "./index";

export async function syncMenuFromPos(
  restaurantId: string,
  provider: PosProvider,
): Promise<PosSyncResult> {
  const integration = await getPosIntegration(restaurantId, provider);
  if (!integration) return { success: false, synced: 0, errors: ["Integration not found"] };
  if (!integration.syncMenu) return { success: false, synced: 0, errors: ["Menu sync disabled"] };

  switch (provider) {
    case "toast":
      return ToastClient.syncMenu(integration.id, restaurantId);
    case "square":
      return SquareClient.syncMenu(integration.id, restaurantId);
    default:
      return { success: false, synced: 0, errors: [`Provider ${provider} not implemented`] };
  }
}

export async function runFullSync(
  restaurantId: string,
  provider: PosProvider,
): Promise<PosSyncResult> {
  const results: PosSyncResult[] = [];

  const menuResult = await syncMenuFromPos(restaurantId, provider);
  results.push(menuResult);

  const totalSynced = results.reduce((s, r) => s + r.synced, 0);
  const allErrors = results.flatMap((r) => r.errors);
  const success = allErrors.length === 0;

  const integration = await getPosIntegration(restaurantId, provider);
  if (integration) {
    await logSync(
      integration.id,
      "import",
      "menu",
      success ? "success" : "error",
      { synced: totalSynced, errors: allErrors.slice(0, 10) },
    );
  }

  return { success, synced: totalSynced, errors: allErrors };
}
