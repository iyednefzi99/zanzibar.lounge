"use client";

import { useState } from "react";

import { LoyaltyCard } from "@/components/loyalty-card";

type Props = { locale: string };

const DICTS: Record<string, ReturnType<typeof buildDict>> = {
  fr: buildDict("fr"),
  ar: buildDict("ar"),
  en: buildDict("en"),
};

function buildDict(locale: string) {
  return {
    title: locale === "fr" ? "Ma carte" : locale === "ar" ? "بطاقتي" : "My card",
    points: locale === "fr" ? "Points" : locale === "ar" ? "النقاط" : "Points",
    tier: locale === "fr" ? "Palier" : locale === "ar" ? "المستوى" : "Tier",
    discount: locale === "fr" ? "Réduction" : locale === "ar" ? "الخصم" : "Discount",
    nextTier: locale === "fr" ? "Prochain palier" : locale === "ar" ? "المستوى التالي" : "Next tier",
    pointsToNext: locale === "fr" ? "points pour" : locale === "ar" ? "نقاط لـ" : "points to",
    history: locale === "fr" ? "Historique" : locale === "ar" ? "السجل" : "History",
    earned: locale === "fr" ? "Gagné" : locale === "ar" ? "محقق" : "Earned",
    redeemed: locale === "fr" ? "Réclamé" : locale === "ar" ? "مستخدم" : "Redeemed",
    reservationCompleted: locale === "fr" ? "Réservation" : locale === "ar" ? "حجز" : "Booking",
    review: locale === "fr" ? "Avis" : locale === "ar" ? "تقييم" : "Review",
    referral: locale === "fr" ? "Parrainage" : locale === "ar" ? "إحالة" : "Referral",
    bonus: locale === "fr" ? "Bonus" : locale === "ar" ? "مكافأة" : "Bonus",
  };
}

export function LoyaltyCardSection({ locale }: Props) {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const dict = DICTS[locale] ?? DICTS.fr;

  if (submitted && phone) {
    return (
      <section className="mt-10">
        <LoyaltyCard phone={phone} dictionary={dict} />
      </section>
    );
  }

  return (
    <section className="mt-10">
      <p className="text-sm text-shell-dim">
        {locale === "fr"
          ? "Entrez votre numéro pour voir votre solde et votre historique."
          : locale === "ar"
            ? "أدخل رقمك لرؤية رصيدك وسجلك."
            : "Enter your phone number to see your balance and history."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (phone.trim()) setSubmitted(true);
        }}
        className="mt-4 flex gap-3"
      >
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+216..."
          className="flex-1 rounded-full border border-shell/25 bg-transparent px-4 py-2.5 text-shell placeholder:text-shell-dim/40 focus:border-brass focus:outline-none"
        />
        <button
          type="submit"
          disabled={!phone.trim()}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-brass bg-brass px-6 text-sm font-medium text-deep transition-colors hover:bg-brass/80 disabled:opacity-40"
        >
          {locale === "fr" ? "Voir" : locale === "ar" ? "عرض" : "View"}
        </button>
      </form>
    </section>
  );
}
