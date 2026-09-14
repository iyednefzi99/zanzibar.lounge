"use client";

import { useState } from "react";

type Props = {
  templates: Array<{ id: string; name: string; cuisine: string }>;
  selected: string;
  onSelect: (id: string) => void;
};

export function MenuTemplateSelector({ templates, selected, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`rounded-xl border p-4 text-left transition-all ${
            selected === t.id
              ? "border-brass bg-brass/10 shadow-lg"
              : "border-shell/10 bg-deep/40 hover:border-shell/20"
          }`}
        >
          <p className="font-display text-lg text-shell">{t.name}</p>
          <p className="mt-1 text-xs text-shell-dim">{t.cuisine}</p>
        </button>
      ))}
      <button
        onClick={() => onSelect("custom")}
        className={`rounded-xl border p-4 text-left transition-all ${
          selected === "custom"
            ? "border-brass bg-brass/10 shadow-lg"
            : "border-dashed border-shell/20 bg-deep/20 hover:border-shell/30"
        }`}
      >
        <p className="font-display text-lg text-shell-dim">Menu vierge</p>
        <p className="mt-1 text-xs text-shell-dim">Commencer à zéro</p>
      </button>
    </div>
  );
}

type Props2 = {
  currentStep: string;
  steps: string[];
};

export function OnboardingProgress({ currentStep, steps }: Props2) {
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
              i < currentIdx
                ? "bg-brass text-deep"
                : i === currentIdx
                  ? "bg-brass/20 text-brass ring-2 ring-brass"
                  : "bg-shell/10 text-shell-dim"
            }`}
          >
            {i < currentIdx ? "✓" : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 ${i < currentIdx ? "bg-brass" : "bg-shell/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
