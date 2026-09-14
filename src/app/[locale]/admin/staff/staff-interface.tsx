"use client";

import { useState } from "react";
import { addStaff, toggleActive, updateRole } from "./actions";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  active: boolean;
};

const ROLE_OPTIONS = [
  { value: "STAFF", label: "Personnel" },
  { value: "MANAGER", label: "Gérant" },
  { value: "OWNER", label: "Propriétaire" },
] as const;

export default function StaffInterface({ staff }: { staff: Staff[] }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER" | "STAFF">("STAFF");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    await addStaff({ name: name.trim(), email: email.trim(), role });
    setName("");
    setEmail("");
    setRole("STAFF");
    setShowForm(false);
    setLoading(false);
    window.location.reload();
  }

  async function handleToggle(id: string) {
    await toggleActive(id);
    window.location.reload();
  }

  async function handleRoleChange(id: string, newRole: string) {
    await updateRole(id, newRole as "OWNER" | "MANAGER" | "STAFF");
    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-shell">Membres</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-brass bg-brass px-4 text-xs font-medium text-deep transition-colors hover:bg-brass/80"
        >
          {showForm ? "Annuler" : "Ajouter un membre"}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-brass/30 bg-deep/40 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
            />
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "OWNER" | "MANAGER" | "STAFF")
              }
              className="rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell focus:border-brass focus:outline-none"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim() || !email.trim()}
            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full border border-lagoon bg-lagoon/20 px-4 text-xs font-medium text-lagoon transition-colors hover:bg-lagoon/30 disabled:opacity-40"
          >
            {loading ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      )}

      {staff.length === 0 ? (
        <p className="mt-8 py-8 text-center text-shell-dim">
          Aucun membre dans l&apos;équipe.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {staff.map((s) => (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-xl border border-shell/12 bg-deep/40 px-5 py-4"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 start-0 w-[3px] ${s.active ? "bg-lagoon/70" : "bg-coral/50"}`}
              />
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ps-3">
                <div className="flex flex-col gap-1">
                  <span className="text-shell">{s.name}</span>
                  <span className="font-mono text-xs text-shell-dim">
                    {s.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={s.role}
                    onChange={(e) => handleRoleChange(s.id, e.target.value)}
                    className="rounded-full border border-shell/20 bg-deep/40 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase text-shell focus:border-brass focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleToggle(s.id)}
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase transition-colors ${
                      s.active
                        ? "border-coral/50 text-coral hover:bg-coral/10"
                        : "border-lagoon/50 text-lagoon hover:bg-lagoon/10"
                    }`}
                  >
                    {s.active ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
