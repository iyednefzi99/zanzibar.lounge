import { requireAdmin } from "@/lib/admin-auth";
import { getDefaultRestaurantId } from "@/lib/restaurant";
import { getPaymentConfig } from "@/lib/payments/config";
import { PaymentConfigForm } from "@/components/payments/payment-config-form";

export const dynamic = "force-dynamic";

export default async function PaymentConfigPage() {
  await requireAdmin();
  const restaurantId = await getDefaultRestaurantId();
  const config = await getPaymentConfig(restaurantId);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-3xl text-shell">Configuration des paiements</h1>
        <p className="mt-2 text-sm text-shell-dim">
          Configurez les dépôts, pré-autorisations et frais d&apos;annulation.
        </p>
      </div>

      <section className="rounded-xl border border-shell/10 bg-deep/40 p-6">
        <PaymentConfigForm config={config} />
      </section>
    </div>
  );
}
