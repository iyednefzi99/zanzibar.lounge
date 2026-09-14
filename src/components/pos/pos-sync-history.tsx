"use client";

type SyncLog = {
  id: string;
  direction: string;
  entityType: string;
  status: string;
  createdAt: string;
  integration: { provider: string };
  details?: { synced?: number; errors?: string[] };
};

export function PosSyncHistory({ logs }: { logs: SyncLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-shell/10 bg-deep/40 py-8 text-center">
        <p className="text-sm text-shell-dim">Aucune synchronisation effectuée.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between rounded-lg border border-shell/10 bg-deep/40 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-block size-2 rounded-full ${
                log.status === "success"
                  ? "bg-lagoon"
                  : log.status === "error"
                    ? "bg-coral"
                    : "bg-brass"
              }`}
            />
            <div>
              <p className="text-sm text-shell">
                {log.direction === "import" ? "Import" : "Export"} {log.entityType}
              </p>
              <p className="text-xs text-shell-dim">
                {log.integration.provider} · {new Date(log.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
          <div className="text-right">
            {log.details?.synced !== undefined && (
              <p className="text-sm text-lagoon">{log.details.synced} éléments</p>
            )}
            {log.details?.errors && log.details.errors.length > 0 && (
              <p className="text-xs text-coral">{log.details.errors.length} erreur(s)</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
