"use client";

import { useEffect, useState } from "react";

type ReferralInfo = {
  id: string;
  code: string;
  status: "pending" | "completed" | "expired";
  rewardPoints: number;
  referredGuestId: string | null;
  createdAt: string;
};

type Dict = {
  title: string;
  shareCode: string;
  copy: string;
  copied: string;
  stats: string;
  totalReferrals: string;
  completed: string;
  pending: string;
  pointsEarned: string;
  howItWorks: string;
  step1: string;
  step2: string;
  step3: string;
  createCode: string;
  creating: string;
  error: string;
};

const DICTS: Record<string, Dict> = {
  fr: {
    title: "Parrainage",
    shareCode: "Votre code de parrainage",
    copy: "Copier",
    copied: "Copié !",
    stats: "Statistiques",
    totalReferrals: "Parrainages total",
    completed: "Complétés",
    pending: "En attente",
    pointsEarned: "Points gagnés",
    howItWorks: "Comment ça marche",
    step1: "Partagez votre code avec vos amis",
    step2: "Ils s'inscrivent avec votre code",
    step3: "Vous gagnez tous les deux des points !",
    createCode: "Générer mon code",
    creating: "Génération…",
    error: "Une erreur est survenue.",
  },
  ar: {
    title: "الإحالة",
    shareCode: "كود الإحالة الخاص بك",
    copy: "نسخ",
    copied: "تم النسخ!",
    stats: "الإحصائيات",
    totalReferrals: "إجمالي الإحالات",
    completed: "مكتملة",
    pending: "قيد الانتظار",
    pointsEarned: "النقاط المكتسبة",
    howItWorks: "كيف يعمل",
    step1: "شارك الكود مع أصدقائك",
    step2: "يسجلون بالكود الخاص بك",
    step3: "تكسب نقاط معًا!",
    createCode: "إنشاء كودي",
    creating: "جارٍ الإنشاء…",
    error: "حدث خطأ.",
  },
  en: {
    title: "Referral",
    shareCode: "Your referral code",
    copy: "Copy",
    copied: "Copied!",
    stats: "Statistics",
    totalReferrals: "Total referrals",
    completed: "Completed",
    pending: "Pending",
    pointsEarned: "Points earned",
    howItWorks: "How it works",
    step1: "Share your code with friends",
    step2: "They sign up using your code",
    step3: "You both earn points!",
    createCode: "Generate my code",
    creating: "Generating…",
    error: "Something went wrong.",
  },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-brass/20 text-brass",
  completed: "bg-lagoon/20 text-lagoon",
  expired: "bg-shell/10 text-shell-dim",
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  fr: { pending: "En attente", completed: "Complété", expired: "Expiré" },
  ar: { pending: "قيد الانتظار", completed: "مكتمل", expired: "منتهي" },
  en: { pending: "Pending", completed: "Completed", expired: "Expired" },
};

export function ReferralCard({ locale = "fr" }: { locale?: string }) {
  const dict = DICTS[locale] ?? DICTS.fr;
  const [referrals, setReferrals] = useState<ReferralInfo[]>([]);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.referrals) setReferrals(data.referrals);
      });
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(false);
    try {
      const res = await fetch("/api/referrals", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.referral) {
          setReferrals((prev) => {
            const exists = prev.some((r) => r.code === data.referral.code);
            if (exists) return prev;
            return [data.referral, ...prev];
          });
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const activeCode = referrals.find((r) => r.status === "pending");
  const completedCount = referrals.filter((r) => r.status === "completed").length;
  const totalPoints = referrals
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.rewardPoints, 0);

  return (
    <div className="rounded-xl border border-brass/30 bg-deep/60 p-6">
      <h3 className="font-display text-2xl text-shell">{dict.title}</h3>

      {/* Code actif */}
      {activeCode ? (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-shell-dim/80">
            {dict.shareCode}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex-1 rounded-lg border border-brass/20 bg-deep px-4 py-3 font-mono text-2xl tracking-widest text-brass">
              {activeCode.code}
            </span>
            <button
              onClick={() => copyCode(activeCode.code)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-brass bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/80"
            >
              {copied ? dict.copied : dict.copy}
            </button>
          </div>
          <p className="mt-2 text-xs text-shell-dim">
            {activeCode.rewardPoints} {dict.pointsEarned} par parrainage
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-brass bg-brass px-8 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
          >
            {creating ? dict.creating : dict.createCode}
          </button>
          {error && <p className="mt-2 text-sm text-coral">{dict.error}</p>}
        </div>
      )}

      {/* Statistiques */}
      {referrals.length > 0 && (
        <div className="mt-8 border-t border-shell/10 pt-6">
          <h4 className="font-mono text-xs uppercase tracking-widest text-shell-dim">
            {dict.stats}
          </h4>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <StatBlock
              label={dict.totalReferrals}
              value={referrals.length}
            />
            <StatBlock
              label={dict.completed}
              value={completedCount}
              accent
            />
            <StatBlock
              label={dict.pointsEarned}
              value={`+${totalPoints}`}
              accent
            />
          </div>
        </div>
      )}

      {/* Liste des parrainages */}
      {referrals.length > 0 && (
        <div className="mt-6 space-y-2">
          {referrals.slice(0, 10).map((ref) => (
            <div
              key={ref.id}
              className="flex items-center justify-between rounded-lg border border-shell/10 bg-deep/40 px-4 py-3"
            >
              <span className="font-mono text-sm text-shell">{ref.code}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[ref.status]}`}
              >
                {STATUS_LABELS[locale]?.[ref.status] ?? ref.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Comment ça marche */}
      <div className="mt-8 border-t border-shell/10 pt-6">
        <h4 className="font-mono text-xs uppercase tracking-widest text-shell-dim">
          {dict.howItWorks}
        </h4>
        <ol className="mt-4 space-y-3 text-sm text-shell-dim">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass/20 font-mono text-xs text-brass">
              1
            </span>
            {dict.step1}
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass/20 font-mono text-xs text-brass">
              2
            </span>
            {dict.step2}
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass/20 font-mono text-xs text-brass">
              3
            </span>
            {dict.step3}
          </li>
        </ol>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`font-mono text-2xl tabular-nums ${
          accent ? "text-brass" : "text-shell"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-shell-dim">{label}</p>
    </div>
  );
}
