import { db } from "@/lib/db";

/**
 * White-label branding — dynamic theming based on restaurant settings.
 */

type BrandTheme = {
  primary: string;
  secondary: string;
  accent: string;
  logoUrl: string | null;
  customDomain: string | null;
  restaurantName: string;
  slug: string;
};

const DEFAULTS: BrandTheme = {
  primary: "#C9A96E",
  secondary: "#1B2838",
  accent: "#E8734A",
  logoUrl: null,
  customDomain: null,
  restaurantName: "Zanzibar Lounge",
  slug: "zanzibar-lounge",
};

export async function getBrandTheme(
  restaurantId: string,
): Promise<BrandTheme> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      name: true,
      slug: true,
      brandColor: true,
      logoUrl: true,
      customDomain: true,
    },
  });

  if (!restaurant) return DEFAULTS;

  const primary = restaurant.brandColor ?? DEFAULTS.primary;

  return {
    primary,
    secondary: DEFAULTS.secondary,
    accent: DEFAULTS.accent,
    logoUrl: restaurant.logoUrl,
    customDomain: restaurant.customDomain,
    restaurantName: restaurant.name,
    slug: restaurant.slug,
  };
}

export function generateCSS(theme: BrandTheme): string {
  return `:root {
  --color-brand-primary: ${theme.primary};
  --color-brand-secondary: ${theme.secondary};
  --color-brand-accent: ${theme.accent};
  --color-brand-logo: url(${theme.logoUrl ?? ""});
}`;
}

export type WhiteLabelConfig = {
  theme: BrandTheme;
  css: string;
  isCustomDomain: boolean;
  hostname: string;
};

export async function getWhiteLabelConfig(
  restaurantId: string,
): Promise<WhiteLabelConfig> {
  const theme = await getBrandTheme(restaurantId);
  const css = generateCSS(theme);

  return {
    theme,
    css,
    isCustomDomain: !!theme.customDomain,
    hostname: theme.customDomain ?? `${theme.slug}.zanzibar-lounge.com`,
  };
}

export async function getIntegrationSettings(
  restaurantId: string,
): Promise<{
  googleCalendar: boolean;
  googleBusiness: boolean;
  tripadvisor: boolean;
}> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { integrationSettings: true },
  });

  const settings = restaurant?.integrationSettings as Record<string, boolean> | null;

  return {
    googleCalendar: settings?.googleCalendar ?? false,
    googleBusiness: settings?.googleBusiness ?? false,
    tripadvisor: settings?.tripadvisor ?? false,
  };
}

export async function updateIntegrationSettings(
  restaurantId: string,
  settings: {
    googleCalendar?: boolean;
    googleBusiness?: boolean;
    tripadvisor?: boolean;
  },
): Promise<void> {
  const current = await getIntegrationSettings(restaurantId);
  const updated = { ...current, ...settings };

  await db.restaurant.update({
    where: { id: restaurantId },
    data: { integrationSettings: updated },
  });
}
