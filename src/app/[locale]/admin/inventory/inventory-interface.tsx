"use client";

import { useState, useTransition } from "react";

import {
  createInventoryItemAction,
  fetchInventoryLogAction,
  updateStockAction,
} from "./actions";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  lastUpdated: Date;
  menuItemId: string | null;
  menuItemName: string | null;
  status: "ok" | "low" | "critical";
};

type InventoryLogEntry = {
  id: string;
  change: number;
  reason: string;
  createdAt: Date;
};

type Props = {
  initialItems: InventoryItem[];
  lowStockItems: InventoryItem[];
  menuItems: Array<{ id: string; name: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  ok: "border-green-500/40 bg-green-500/10 text-green-400",
  low: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  low: "Bas",
  critical: "Critique",
};

export function InventoryInterface({
  initialItems,
  lowStockItems,
  menuItems,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [showNewForm, setShowNewForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<InventoryLogEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleUpdateStock(
    inventoryId: string,
    quantity: number,
    reason: string,
  ) {
    setUpdatingId(inventoryId);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("inventoryId", inventoryId);
      fd.set("quantity", String(quantity));
      fd.set("reason", reason);
      await updateStockAction(fd);

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== inventoryId) return item;
          const newQty = item.quantity + quantity;
          return {
            ...item,
            quantity: newQty,
            lastUpdated: new Date(),
            status:
              newQty <= 0 ? ("critical" as const)
              : newQty <= item.minQuantity ? ("low" as const)
              : ("ok" as const),
          };
        }),
      );
      setUpdatingId(null);
    });
  }

  function handleViewLog(inventoryId: string) {
    setLogId(inventoryId);
    startTransition(async () => {
      const entries = await fetchInventoryLogAction(inventoryId, 30);
      setLogEntries(entries);
    });
  }

  return (
    <div className="mt-8">
      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-amber-300">
            Alertes stock bas
          </h3>
          <ul className="mt-2 space-y-1">
            {lowStockItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-block size-2 rounded-full ${
                    item.status === "critical" ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-shell">{item.name}</span>
                <span className="font-mono text-xs text-shell-dim">
                  {item.quantity} {item.unit} / min {item.minQuantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-shell-dim">
          {items.length} article{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowNewForm(true)}
          className="rounded-full border border-brass/40 px-3 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
        >
          + Article
        </button>
      </div>

      {/* New inventory item form */}
      {showNewForm && (
        <NewInventoryForm
          menuItems={menuItems}
          onSave={(fd) => {
            startTransition(async () => {
              await createInventoryItemAction(fd);
              setShowNewForm(false);
            });
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Inventory table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-shell/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-shell/10 font-mono text-[0.65rem] uppercase tracking-widest text-shell-dim">
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Min</th>
              <th className="px-4 py-3">État</th>
              <th className="px-4 py-3">Lien menu</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-shell/5 transition-colors hover:bg-deep/40"
              >
                <td className="px-4 py-3 text-shell">{item.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono tabular-nums" dir="ltr">
                    {item.quantity}
                  </span>
                  <span className="ml-1 text-xs text-shell-dim">
                    {item.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono tabular-nums text-shell-dim" dir="ltr">
                    {item.minQuantity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_COLORS[item.status]}`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-shell-dim">
                  {item.menuItemName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <StockUpdateForm
                      inventoryId={item.id}
                      isPending={isPending && updatingId === item.id}
                      onUpdate={handleUpdateStock}
                    />
                    <button
                      onClick={() => handleViewLog(item.id)}
                      className="rounded-full border border-shell/20 px-2 py-1 text-[0.6rem] text-shell-dim transition-colors hover:border-brass hover:text-brass"
                    >
                      Historique
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && !showNewForm && (
        <p className="py-12 text-center text-sm text-shell-dim">
          Aucun article en inventaire.
        </p>
      )}

      {/* Log modal */}
      {logId && (
        <LogModal
          entries={logEntries}
          itemName={items.find((i) => i.id === logId)?.name ?? ""}
          onClose={() => {
            setLogId(null);
            setLogEntries([]);
          }}
        />
      )}
    </div>
  );
}

function StockUpdateForm({
  inventoryId,
  isPending,
  onUpdate,
}: {
  inventoryId: string;
  isPending: boolean;
  onUpdate: (inventoryId: string, quantity: number, reason: string) => void;
}) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(value);
    if (isNaN(qty) || qty === 0) return;
    onUpdate(inventoryId, qty, reason || "Ajustement manuel");
    setValue("");
    setReason("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="±"
        className="w-16 rounded border border-shell/20 bg-deep px-1.5 py-1 text-center font-mono text-xs text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
      />
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Raison"
        className="w-24 rounded border border-shell/20 bg-deep px-1.5 py-1 text-xs text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending || !value}
        className="rounded-full border border-brass/40 px-2 py-1 text-[0.6rem] text-brass transition-colors hover:bg-brass/10 disabled:opacity-30"
      >
        OK
      </button>
    </form>
  );
}

function NewInventoryForm({
  menuItems,
  onSave,
  onCancel,
}: {
  menuItems: Array<{ id: string; name: string }>;
  onSave: (fd: FormData) => void;
  onCancel: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(new FormData(e.currentTarget));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-brass/30 bg-deep/60 p-4"
    >
      <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
        Nouvel article d&apos;inventaire
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input
          name="name"
          required
          placeholder="Nom"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="quantity"
          type="number"
          step="0.1"
          required
          placeholder="Quantité"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="unit"
          required
          placeholder="Unité (kg, L, pièce)"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <input
          name="minQuantity"
          type="number"
          step="0.1"
          required
          placeholder="Seuil minimum"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell placeholder:text-shell-dim/50 focus:border-brass focus:outline-none"
        />
        <select
          name="menuItemId"
          className="rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
        >
          <option value="">Sans lien menu</option>
          {menuItems.map((mi) => (
            <option key={mi.id} value={mi.id}>
              {mi.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-full border border-brass/40 px-4 py-1.5 text-xs text-brass transition-colors hover:bg-brass/10"
        >
          Créer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-shell/20 px-4 py-1.5 text-xs text-shell-dim transition-colors hover:text-shell"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function LogModal({
  entries,
  itemName,
  onClose,
}: {
  entries: InventoryLogEntry[];
  itemName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4">
      <div className="w-full max-w-lg rounded-xl border border-shell/10 bg-deep p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-brass">
            Historique — {itemName}
          </h3>
          <button
            onClick={onClose}
            className="text-shell-dim hover:text-shell"
          >
            ✕
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-shell-dim">
            Aucun mouvement enregistré.
          </p>
        ) : (
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between rounded-lg border border-shell/5 px-3 py-2"
              >
                <div>
                  <span
                    className={`font-mono text-sm tabular-nums ${
                      entry.change >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                    dir="ltr"
                  >
                    {entry.change >= 0 ? "+" : ""}
                    {entry.change}
                  </span>
                  <span className="ml-2 text-xs text-shell-dim">
                    {entry.reason}
                  </span>
                </div>
                <span className="font-mono text-[0.6rem] text-shell-dim">
                  {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
