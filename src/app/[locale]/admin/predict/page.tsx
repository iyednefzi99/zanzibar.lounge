import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";

export default async function AdminPredictPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Predictions" subtitle="AI-powered forecasting" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {["Demand Forecast", "Waste Prediction", "Schedule Optimization", "No-Show Prediction"].map((item) => (
          <div key={item} className="glass-card rounded-xl p-6">
            <h3 className="font-display text-xl text-shell">{item}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
