"use client";

import { useState, useTransition } from "react";

import type { StaffMember } from "@/lib/staff-auth";

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  OWNER: { bg: "bg-brass/10", text: "text-brass", border: "border-brass/40" },
  MANAGER: { bg: "bg-lagoon/10", text: "text-lagoon", border: "border-lagoon/40" },
  STAFF: { bg: "bg-shell/10", text: "text-shell-dim", border: "border-shell/25" },
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Gérant",
  STAFF: "Personnel",
};

export function TeamClient({
  members,
  addMemberAction,
  changeRoleAction,
  deactivateAction,
}: {
  members: StaffMember[];
  addMemberAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  changeRoleAction: (
    staffId: string,
    role: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  deactivateAction: (
    staffId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await addMemberAction(formData);
    if (!result.ok) {
      setError(result.error ?? "Erreur");
    } else {
      setShowForm(false);
    }
  };

  const handleRoleChange = (staffId: string, role: string) => {
    startTransition(async () => {
      await changeRoleAction(staffId, role);
    });
  };

  const handleDeactivate = (staffId: string) => {
    if (!confirm("Désactiver ce membre ?")) return;
    startTransition(async () => {
      await deactivateAction(staffId);
    });
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-shell">Équipe</h1>
          <p className="mt-2 text-sm text-shell-dim">
            {members.length} membre{members.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full border border-brass/40 px-5 py-2.5 text-sm text-brass transition-colors hover:bg-brass/10"
        >
          {showForm ? "Annuler" : "Ajouter un membre"}
        </button>
      </header>

      {/* Add form */}
      {showForm && (
        <form
          action={handleSubmit}
          className="rounded-2xl border border-brass/30 bg-deep/40 p-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-shell/20 bg-deep px-4 py-3 text-shell placeholder-shell-dim/40 transition-colors focus:border-brass focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
              >
                Nom
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-2 w-full rounded-xl border border-shell/20 bg-deep px-4 py-3 text-shell placeholder-shell-dim/40 transition-colors focus:border-brass focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-2 w-full rounded-xl border border-shell/20 bg-deep px-4 py-3 text-shell placeholder-shell-dim/40 transition-colors focus:border-brass focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-shell-dim/80"
              >
                Rôle
              </label>
              <select
                id="role"
                name="role"
                defaultValue="STAFF"
                className="mt-2 w-full rounded-xl border border-shell/20 bg-deep px-4 py-3 text-shell transition-colors focus:border-brass focus:outline-none"
              >
                <option value="STAFF">Personnel</option>
                <option value="MANAGER">Gérant</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-coral">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-brass px-6 py-2.5 text-sm font-medium text-deep transition-transform hover:scale-[1.03] active:scale-100 disabled:opacity-50"
            >
              {isPending ? "Ajout…" : "Ajouter"}
            </button>
          </div>
        </form>
      )}

      {/* Members list */}
      <div className="space-y-3">
        {members.map((member) => {
          const roleStyle = ROLE_STYLES[member.role] ?? ROLE_STYLES.STAFF;
          return (
            <div
              key={member.id}
              className={`flex flex-wrap items-center gap-4 rounded-xl border border-shell/12 bg-deep/40 p-4 ${
                !member.active ? "opacity-45" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="truncate font-medium text-shell">
                    {member.name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                  {!member.active && (
                    <span className="inline-flex items-center rounded-full border border-coral/40 bg-coral/10 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-coral">
                      Inactif
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-shell-dim">{member.email}</p>
              </div>

              {member.active && member.role !== "OWNER" && (
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value)
                    }
                    className="rounded-lg border border-shell/20 bg-deep px-3 py-1.5 text-sm text-shell transition-colors focus:border-brass focus:outline-none"
                  >
                    <option value="STAFF">Personnel</option>
                    <option value="MANAGER">Gérant</option>
                  </select>
                  <button
                    onClick={() => handleDeactivate(member.id)}
                    className="rounded-lg border border-coral/30 px-3 py-1.5 text-sm text-coral transition-colors hover:bg-coral/10"
                  >
                    Désactiver
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
