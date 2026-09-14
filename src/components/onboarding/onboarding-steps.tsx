"use client";

import { useState } from "react";

type Props = {
  onComplete: (templateId: string) => void;
  templates: Array<{ id: string; name: string; cuisine: string }>;
};

export function OnboardingWizard({ onComplete, templates }: Props) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    address: "",
    phone: "",
    timezone: "Africa/Tunis",
    locale: "fr",
    templateId: "",
  });

  const steps = ["Informations", "Cuisine", "Modèle de menu"];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Progress */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                  i < step
                    ? "bg-brass text-deep"
                    : i === step
                      ? "bg-brass/20 text-brass ring-2 ring-brass"
                      : "bg-shell/10 text-shell-dim"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-12 ${i < step ? "bg-brass" : "bg-shell/10"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-shell">Informations du restaurant</h2>
            <input
              placeholder="Nom du restaurant"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              className="w-full rounded-lg border border-shell/10 bg-deep/60 px-4 py-3 text-shell placeholder:text-shell-dim"
            />
            <input
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
              className="w-full rounded-lg border border-shell/10 bg-deep/60 px-4 py-3 text-shell placeholder:text-shell-dim"
            />
            <input
              placeholder="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
              className="w-full rounded-lg border border-shell/10 bg-deep/60 px-4 py-3 text-shell placeholder:text-shell-dim"
            />
            <button
              onClick={() => setStep(1)}
              disabled={!formData.name || !formData.address}
              className="w-full rounded-lg bg-brass px-4 py-3 text-deep font-medium hover:bg-brass-glow disabled:opacity-40"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-shell">Type de cuisine</h2>
            <div className="grid grid-cols-2 gap-3">
              {["Tunisienne", "Italienne", "Française", "Japonaise", "Mexicaine", "Indienne", "Africaine", "Autre"].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => setFormData((d) => ({ ...d, cuisine: c }))}
                    className={`rounded-lg border p-3 text-sm ${
                      formData.cuisine === c
                        ? "border-brass bg-brass/10 text-brass"
                        : "border-shell/10 text-shell-dim hover:border-shell/20"
                    }`}
                  >
                    {c}
                  </button>
                ),
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 rounded-lg border border-shell/10 px-4 py-3 text-shell-dim hover:bg-shell/5"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.cuisine}
                className="flex-1 rounded-lg bg-brass px-4 py-3 text-deep font-medium hover:bg-brass-glow disabled:opacity-40"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-shell">Modèle de menu</h2>
            <p className="text-sm text-shell-dim">Choisissez un modèle pour pré-remplir votre menu</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFormData((d) => ({ ...d, templateId: t.id }))}
                  className={`rounded-lg border p-4 text-left ${
                    formData.templateId === t.id
                      ? "border-brass bg-brass/10"
                      : "border-shell/10 hover:border-shell/20"
                  }`}
                >
                  <p className="font-medium text-shell">{t.name}</p>
                  <p className="text-xs text-shell-dim">{t.cuisine}</p>
                </button>
              ))}
              <button
                onClick={() => setFormData((d) => ({ ...d, templateId: "custom" }))}
                className={`rounded-lg border p-4 text-left ${
                  formData.templateId === "custom"
                    ? "border-brass bg-brass/10"
                    : "border-dashed border-shell/20 hover:border-shell/30"
                }`}
              >
                <p className="font-medium text-shell-dim">Menu vierge</p>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-shell/10 px-4 py-3 text-shell-dim hover:bg-shell/5"
              >
                Retour
              </button>
              <button
                onClick={() => onComplete(formData.templateId)}
                disabled={!formData.templateId}
                className="flex-1 rounded-lg bg-brass px-4 py-3 text-deep font-medium hover:bg-brass-glow disabled:opacity-40"
              >
                Créer mon restaurant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
