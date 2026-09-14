"use client";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useOfflineOrders } from "@/hooks/use-offline-orders";

export function InstallBanner() {
  const { install, canInstall, isInstalled } = useInstallPrompt();

  if (isInstalled || !canInstall) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brass p-3 text-center text-deep">
      <div className="flex items-center justify-center gap-4">
        <p className="text-sm font-medium">
          Installer E-Coffee Node sur votre appareil
        </p>
        <button
          onClick={install}
          className="rounded-lg bg-deep px-4 py-2 text-sm font-medium text-brass hover:bg-deep/80"
        >
          Installer
        </button>
      </div>
    </div>
  );
}

export function OfflineIndicator() {
  const { isOnline, offlineOrders } = useOfflineOrders();

  if (isOnline && offlineOrders.length === 0) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm ${
      isOnline ? "bg-lagoon/20 text-lagoon" : "bg-ember/20 text-ember"
    }`}>
      {isOnline
        ? `${offlineOrders.length} commande(s) hors-ligne à synchroniser`
        : "Vous êtes hors-ligne — les commandes seront synchronisées automatiquement"
      }
    </div>
  );
}
