"use client";

import { useEffect, useRef, useState } from "react";

import { EmbedWidget } from "@/components/embed-widget";

type Config = {
  name: string;
  slug: string;
  brandColor: string | null;
  locale: string;
};

export default function WidgetAdminPage() {
  const [slug, setSlug] = useState("zanzibar");
  const [theme, setTheme] = useState("");
  const [lang, setLang] = useState<"fr" | "ar" | "en">("fr");
  const [config, setConfig] = useState<Config | null>(null);
  const [copied, setCopied] = useState<"iframe" | "sdk" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/widget/config/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        if (data.ok) {
          setConfig({
            name: data.data.name,
            slug: data.data.slug,
            brandColor: data.data.brandColor,
            locale: data.data.locale,
          });
        } else {
          setConfig(null);
        }
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) setConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const iframeCode = `<iframe
  src="${siteUrl}/widget/${slug}?lang=${lang}${theme ? `&theme=${theme}` : ""}"
  width="100%"
  height="640"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 480px;"
  title="Réservation ${config?.name ?? slug}"
  loading="lazy"
></iframe>`;

  const sdkCode = `<!-- Zanzibar Lounge Widget -->
<div id="zanzibar-widget"></div>
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${siteUrl}/widget.js';
    s.async = true;
    s.onload = function() {
      ZanzibarWidget.init({
        el: '#zanzibar-widget',
        slug: '${slug}',
        lang: '${lang}',
        ${theme ? `theme: '${theme}',` : ""}
      });
    };
    document.head.appendChild(s);
  })();
</script>`;

  async function copyToClipboard(text: string, which: "iframe" | "sdk") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl text-shell">Widget de réservation</h1>
      <p className="mt-2 text-sm text-shell-dim">
        Intégrez le formulaire de réservation sur votre site.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Section title="Configuration">
            <Field label="Slug du restaurant">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={inputClass}
                placeholder="zanzibar"
              />
            </Field>

            <Field label="Couleur principale (hex)">
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={theme || config?.brandColor || "#c9922e"}
                  onChange={(e) => setTheme(e.target.value)}
                  className="h-11 w-11 cursor-pointer rounded border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder={config?.brandColor ?? "#c9922e"}
                />
              </div>
            </Field>

            <Field label="Langue">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "fr" | "ar" | "en")}
                className={inputClass}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
          </Section>

          <Section title="Code d'intégration (iframe)">
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border border-shell/20 bg-deep/60 p-4 font-mono text-xs text-shell-dim">
                {iframeCode}
              </pre>
              <CopyButton
                onClick={() => copyToClipboard(iframeCode, "iframe")}
                copied={copied === "iframe"}
              />
            </div>
          </Section>

          <Section title="SDK JavaScript">
            <p className="mb-3 text-xs text-shell-dim">
              Pour une intégration avancée avec contrôle programmatique.
            </p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border border-shell/20 bg-deep/60 p-4 font-mono text-xs text-shell-dim">
                {sdkCode}
              </pre>
              <CopyButton
                onClick={() => copyToClipboard(sdkCode, "sdk")}
                copied={copied === "sdk"}
              />
            </div>
          </Section>
        </div>

        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim">
            Aperçu
          </h2>
          <div
            ref={previewRef}
            className="mt-3 overflow-hidden rounded-xl border border-shell/20"
          >
            <EmbedWidget
              slug={slug}
              theme={theme || undefined}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-shell-dim/20 bg-night p-5">
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-mono text-xs uppercase tracking-[0.16em] text-shell-dim">
        {label}
      </label>
      {children}
    </div>
  );
}

function CopyButton({
  onClick,
  copied,
}: {
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-3 right-3 inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-xs transition-colors ${
        copied
          ? "border-lagoon bg-lagoon/15 text-lagoon"
          : "border-shell/25 text-shell hover:border-brass hover:text-brass"
      }`}
    >
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-shell/20 bg-deep/60 px-3.5 py-2.5 text-shell transition-colors placeholder:text-shell-dim/80 focus:border-brass";
