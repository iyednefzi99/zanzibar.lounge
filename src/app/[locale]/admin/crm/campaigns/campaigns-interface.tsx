"use client";

import { useState } from "react";
import {
  createNewCampaign,
  updateExistingCampaign,
  sendCampaignById,
} from "./actions";

type Campaign = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  content: string;
  status: string;
  sentCount: number;
  openCount: number;
};

export default function CampaignsInterface({
  campaigns,
}: {
  campaigns: Campaign[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setType("email");
    setSubject("");
    setContent("");
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(c: Campaign) {
    setEditingId(c.id);
    setName(c.name);
    setType(c.type);
    setSubject(c.subject ?? "");
    setContent(c.content);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!name.trim() || !content.trim()) return;
    setLoading(true);
    if (editingId) {
      await updateExistingCampaign(editingId, {
        name: name.trim(),
        subject: subject.trim() || undefined,
        content: content.trim(),
      });
    } else {
      await createNewCampaign({
        name: name.trim(),
        type,
        subject: subject.trim() || undefined,
        content: content.trim(),
      });
    }
    reset();
    setLoading(false);
    window.location.reload();
  }

  async function handleSend(id: string) {
    await sendCampaignById(id);
    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-shell">Campagnes</h2>
        <button
          onClick={() => {
            reset();
            setShowForm(!showForm);
          }}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-brass bg-brass px-4 text-xs font-medium text-deep transition-colors hover:bg-brass/80"
        >
          {showForm ? "Annuler" : "Nouvelle campagne"}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-brass/30 bg-deep/40 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nom de la campagne"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell focus:border-brass focus:outline-none"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Sujet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
          />
          <textarea
            placeholder="Contenu du message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-shell/20 bg-deep/40 px-4 py-2.5 text-sm text-shell placeholder-shell-dim/50 focus:border-brass focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !content.trim()}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-lagoon bg-lagoon/20 px-4 text-xs font-medium text-lagoon transition-colors hover:bg-lagoon/30 disabled:opacity-40"
          >
            {loading
              ? "Enregistrement..."
              : editingId
                ? "Mettre à jour"
                : "Créer"}
          </button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="mt-6 rounded-xl border border-shell/10 bg-deep/40 py-12 text-center">
          <p className="text-shell-dim">Aucune campagne créée.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-shell/10 bg-deep/40 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-shell">{c.name}</p>
                <p className="text-xs text-shell-dim">
                  {c.type.toUpperCase()} · {c.sentCount} envoyés
                  {c.openCount > 0 && ` · ${c.openCount} ouverts`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] uppercase ${
                    c.status === "sent"
                      ? "bg-lagoon/15 text-lagoon"
                      : c.status === "draft"
                        ? "bg-shell/10 text-shell-dim"
                        : c.status === "scheduled"
                          ? "bg-brass/15 text-brass"
                          : "bg-coral/15 text-coral"
                  }`}
                >
                  {c.status}
                </span>
                <button
                  onClick={() => startEdit(c)}
                  className="inline-flex min-h-7 items-center justify-center rounded-full border border-shell/20 px-3 text-[0.65rem] font-medium text-shell-dim transition-colors hover:border-brass/40 hover:text-shell"
                >
                  Modifier
                </button>
                {c.status === "draft" && (
                  <button
                    onClick={() => handleSend(c.id)}
                    className="inline-flex min-h-7 items-center justify-center rounded-full border border-lagoon/40 px-3 text-[0.65rem] font-medium text-lagoon transition-colors hover:bg-lagoon/10"
                  >
                    Envoyer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
