import { notFound } from "next/navigation";

import { WidgetFrame } from "@/components/widget/widget-frame";
import { getWidgetConfigResponse, type WidgetConfig } from "@/lib/widget-config";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const config = await getWidgetConfigResponse(slug);
  if (!config) notFound();

  const localeParam = typeof sp.locale === "string" ? sp.locale : config.locale;
  const locale: Locale = isLocale(localeParam) ? localeParam : "fr";
  const dictionary = await getDictionary(locale);

  const theme = {
    ...config.theme,
    primaryColor:
      typeof sp.color === "string" && /^[0-9A-Fa-f]{6}$/.test(sp.color)
        ? sp.color
        : config.theme.primaryColor,
    backgroundColor:
      typeof sp.bg === "string" && /^[0-9A-Fa-f]{6}$/.test(sp.bg)
        ? sp.bg
        : config.theme.backgroundColor,
  };

  const frame: Pick<
    WidgetConfig,
    "zones" | "simplifiedForm" | "showMenu" | "showReviews" | "defaultLocale"
  > = {
    zones: config.zones,
    simplifiedForm: sp.simple === "1" || config.simplifiedForm,
    showMenu: config.showMenu,
    showReviews: config.showReviews,
    defaultLocale: config.locale,
  };

  return (
    <WidgetFrame
      slug={slug}
      name={config.name}
      theme={theme}
      zones={frame.zones}
      simplifiedForm={frame.simplifiedForm}
      locale={locale}
      dictionary={dictionary}
    />
  );
}
