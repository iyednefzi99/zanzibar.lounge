"use client";

import { useState } from "react";
import { toggleAutomation } from "./actions";

type Rule = {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
};

export default function AutomationsInterface({
  rules,
  restaurantId,
}: {
  rules: Rule[];
  restaurantId: string;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(ruleId: string, current: boolean) {
    setToggling(ruleId);
    await toggleAutomation(restaurantId, ruleId, !current);
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="relative overflow-hidden rounded-xl border border-shell/12 bg-deep/40 px-5 py-4"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 start-0 w-[3px] ${rule.enabled ? "bg-lagoon/70" : "bg-shell/20"}`}
          />
          <div className="flex items-center justify-between gap-4 ps-3">
            <div>
              <p className="text-sm font-medium text-shell">{rule.name}</p>
              <p className="text-xs text-shell-dim">{rule.description}</p>
            </div>
            <button
              onClick={() => handleToggle(rule.id, rule.enabled)}
              disabled={toggling === rule.id}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors ${
                rule.enabled ? "bg-lagoon" : "bg-shell/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  rule.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
