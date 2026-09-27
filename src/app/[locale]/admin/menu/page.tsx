import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { isLocale } from "@/i18n/config";
import { menu, currency } from "@/content/menu";

export default async function AdminMenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div>
      <PageHeader title="Menu Management" subtitle="Edit your menu items and categories" />

      <div className="mt-6 space-y-8">
        {menu.map((category) => (
          <div key={category.id} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-shell">{category.name[locale as keyof typeof category.name]}</h3>
              <button type="button" className="rounded-lg border border-shell/20 px-3 py-1.5 text-xs text-shell-dim transition-colors hover:border-brass hover:text-brass">
                Edit Category
              </button>
            </div>
            <ul className="mt-4 divide-y divide-shell/10">
              {category.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-shell">{item.name[locale as keyof typeof item.name]}</p>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-shell-dim">{item.description[locale as keyof typeof item.description]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-brass">
                      {item.price === null ? "Market" : `${item.price} ${currency}`}
                    </span>
                    <button type="button" className="rounded-lg border border-shell/20 px-2 py-1 text-xs text-shell-dim transition-colors hover:border-brass hover:text-brass">
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
