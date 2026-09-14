"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getSupportedLocales,
  getLocaleInfo,
  getRTL_LOCALES,
} from "@/lib/i18n-manager";
import type { Locale } from "@/i18n/config";

type Dictionary = Record<string, unknown>;

interface LocaleStatus {
  code: Locale;
  name: string;
  dir: "ltr" | "rtl";
  flag: string;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  completionPercent: number;
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function TranslationsInterface() {
  const [allDictionaries, setAllDictionaries] = useState<
    Record<Locale, Dictionary>
  >({} as Record<Locale, Dictionary>);
  const [selectedLocale, setSelectedLocale] = useState<Locale | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewPath, setPreviewPath] = useState("");
  const [importText, setImportText] = useState("");
  const [importTarget, setImportTarget] = useState<Locale | null>(null);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const locales = getSupportedLocales();
  const rtlLocales = useMemo(() => new Set(getRTL_LOCALES()), []);

  useEffect(() => {
    Promise.all(
      locales.map(async (locale) => {
        const dict = await import(
          `@/i18n/dictionaries/${locale}`
        ).then((m) => m.default as Dictionary);
        return [locale, dict] as const;
      }),
    ).then((entries) => {
      setAllDictionaries(Object.fromEntries(entries) as Record<
        Locale,
        Dictionary
      >);
      setLoading(false);
    });
  }, [locales]);

  const baseKeys = useMemo(() => {
    if (!allDictionaries.fr) return [];
    return flattenKeys(allDictionaries.fr);
  }, [allDictionaries]);

  const statuses: LocaleStatus[] = useMemo(() => {
    return locales.map((locale) => {
      const dict = allDictionaries[locale];
      if (!dict) {
        return {
          ...getLocaleInfo(locale),
          totalKeys: baseKeys.length,
          translatedKeys: 0,
          missingKeys: baseKeys,
          completionPercent: 0,
        };
      }

      const missing = baseKeys.filter((key) => {
        const val = getNestedValue(dict, key);
        return val === undefined || val === null || val === "";
      });

      const translated = baseKeys.length - missing.length;
      const percent =
        baseKeys.length > 0
          ? Math.round((translated / baseKeys.length) * 100)
          : 0;

      return {
        ...getLocaleInfo(locale),
        totalKeys: baseKeys.length,
        translatedKeys: translated,
        missingKeys: missing,
        completionPercent: percent,
      };
    });
  }, [locales, allDictionaries, baseKeys]);

  const exportLocale = useCallback(
    (locale: Locale) => {
      const dict = allDictionaries[locale];
      if (!dict) return;
      const blob = new Blob([JSON.stringify(dict, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${locale}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [allDictionaries],
  );

  const exportAll = useCallback(() => {
    const data = Object.fromEntries(
      locales.map((l) => [l, allDictionaries[l] ?? {}]),
    );
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations-all.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [locales, allDictionaries]);

  const handleImport = useCallback(() => {
    setImportError("");
    setImportSuccess("");

    if (!importTarget) {
      setImportError("Select a target locale.");
      return;
    }

    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed !== "object" || parsed === null) {
        setImportError("Invalid JSON: expected an object.");
        return;
      }

      const blob = new Blob(
        [`export default ${JSON.stringify(parsed, null, 2)};`],
        { type: "application/typescript" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${importTarget}.ts`;
      a.click();
      URL.revokeObjectURL(url);

      setImportSuccess(
        `Exported ${importTarget}.ts — replace src/i18n/dictionaries/${importTarget}.ts and reload.`,
      );
      setImportText("");
    } catch {
      setImportError("Invalid JSON. Paste a valid translation object.");
    }
  }, [importTarget, importText]);

  const selectedStatus = selectedLocale
    ? statuses.find((s) => s.code === selectedLocale) ?? null
    : null;

  const previewResult = useMemo(() => {
    if (!selectedLocale || !previewPath || !allDictionaries[selectedLocale])
      return null;
    return getNestedValue(
      allDictionaries[selectedLocale] as Record<string, unknown>,
      previewPath,
    );
  }, [selectedLocale, previewPath, allDictionaries]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-4xl text-shell">
          Translation Manager
        </h1>
        <p className="mt-8 text-shell-dim">Loading dictionaries…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-4xl text-shell">
          Translation Manager
        </h1>
        <button
          type="button"
          onClick={exportAll}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-shell/25 px-4 text-sm text-shell-dim transition-colors hover:border-brass hover:text-brass"
        >
          Export All
        </button>
      </header>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-shell-dim/80">
          Locale Completion
        </h2>
        <ul className="mt-4 space-y-3">
          {statuses.map((status) => (
            <li
              key={status.code}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                selectedLocale === status.code
                  ? "border-brass bg-brass/5"
                  : "border-shell/12 bg-deep/40 hover:border-shell/25"
              }`}
              onClick={() => setSelectedLocale(status.code)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" role="img" aria-label={status.name}>
                  {status.flag}
                </span>
                <span className="font-medium text-shell">{status.name}</span>
                <span
                  className="font-mono text-xs text-shell-dim"
                  dir={rtlLocales.has(status.code) ? "rtl" : "ltr"}
                >
                  {status.code.toUpperCase()}
                </span>
                <span className="ms-auto font-mono text-xs text-shell-dim">
                  {status.translatedKeys}/{status.totalKeys}
                </span>
                <span
                  className={`font-mono text-xs ${
                    status.completionPercent === 100
                      ? "text-lagoon"
                      : status.completionPercent >= 50
                        ? "text-brass"
                        : "text-coral"
                  }`}
                >
                  {status.completionPercent}%
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-shell/10">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.completionPercent === 100
                      ? "bg-lagoon"
                      : status.completionPercent >= 50
                        ? "bg-brass"
                        : "bg-coral"
                  }`}
                  style={{ width: `${status.completionPercent}%` }}
                />
              </div>

              {status.missingKeys.length > 0 && (
                <p className="mt-2 text-xs text-shell-dim">
                  {status.missingKeys.length} missing key
                  {status.missingKeys.length !== 1 ? "s" : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {selectedStatus && (
        <section className="mt-10 rounded-xl border border-shell/12 bg-deep/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-2xl text-shell">
              <span className="text-xl">{selectedStatus.flag}</span>
              {selectedStatus.name}
            </h2>
            <button
              type="button"
              onClick={() => exportLocale(selectedStatus.code)}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-shell/25 px-4 text-sm text-shell-dim transition-colors hover:border-brass hover:text-brass"
            >
              Export {selectedStatus.code.toUpperCase()}
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-mono uppercase tracking-[0.18em] text-shell-dim/80">
              Preview Key Path
            </label>
            <input
              type="text"
              value={previewPath}
              onChange={(e) => setPreviewPath(e.target.value)}
              placeholder="e.g. hero.title or booking.fields.name"
              className="mt-2 w-full rounded-lg border border-shell/20 bg-deep px-3 py-2 font-mono text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
            />
            {previewPath && (
              <div className="mt-2 rounded-lg border border-shell/10 bg-deep/80 p-3">
                <span className="font-mono text-xs text-shell-dim">
                  {previewPath}
                </span>
                <p className="mt-1 text-sm text-shell">
                  {previewResult !== null
                    ? typeof previewResult === "object"
                      ? JSON.stringify(previewResult)
                      : String(previewResult)
                    : "Key not found"}
                </p>
              </div>
            )}
          </div>

          {selectedStatus.missingKeys.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-coral/80">
                Missing Keys
              </h3>
              <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                {selectedStatus.missingKeys.map((key) => (
                  <li
                    key={key}
                    className="font-mono text-xs text-shell-dim hover:text-shell"
                  >
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="mt-10 rounded-xl border border-shell/12 bg-deep/40 p-5">
        <h2 className="font-display text-2xl text-shell">Import Translations</h2>
        <p className="mt-1 text-sm text-shell-dim">
          Paste a JSON object matching the French dictionary structure. The file
          will be exported as a TypeScript module.
        </p>

        <div className="mt-4">
          <label className="block text-xs font-mono uppercase tracking-[0.18em] text-shell-dim/80">
            Target Locale
          </label>
          <select
            value={importTarget ?? ""}
            onChange={(e) => setImportTarget(e.target.value as Locale | null)}
            className="mt-2 w-full rounded-lg border border-shell/20 bg-deep px-3 py-2 text-sm text-shell focus:border-brass focus:outline-none"
          >
            <option value="">Select locale…</option>
            {locales.map((l) => (
              <option key={l} value={l}>
                {getLocaleInfo(l).flag} {getLocaleInfo(l).name} ({l.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-mono uppercase tracking-[0.18em] text-shell-dim/80">
            JSON Content
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder='{"hero": {"title": "..."}, "nav": {"menu": "..."}}'
            className="mt-2 w-full rounded-lg border border-shell/20 bg-deep px-3 py-2 font-mono text-sm text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
          />
        </div>

        {importError && (
          <p className="mt-2 text-sm text-coral">{importError}</p>
        )}
        {importSuccess && (
          <p className="mt-2 text-sm text-lagoon">{importSuccess}</p>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={!importTarget || !importText.trim()}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-brass/60 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/10 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Generate .ts File
        </button>
      </section>
    </div>
  );
}
