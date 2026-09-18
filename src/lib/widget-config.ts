/**
 * Widget blanc (white-label).
 *
 * Widget embeddable entièrement customisable par le restaurant :
 * - Couleurs (primary, secondary, background, text)
 * - Logo
 * - Font
 * - Zones affichées
 * - Formulaire simplifié ou complet
 * - Intégration iframe
 */

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type WidgetTheme = {
  /** Couleur principale (hex sans #) */
  primaryColor: string;
  /** Couleur secondaire */
  secondaryColor: string;
  /** Couleur de fond */
  backgroundColor: string;
  /** Couleur du texte */
  textColor: string;
  /** Police de caractères */
  fontFamily: string;
  /** Bordure arrondie (px) */
  borderRadius: number;
  /** Logo URL */
  logoUrl: string | null;
  /** Titre personnalisé */
  title: string;
  /** Sous-titre personnalisé */
  subtitle: string;
};

export type WidgetConfig = {
  id: string;
  restaurantId: string;
  slug: string;
  theme: WidgetTheme;
  /** Zones à afficher */
  zones: string[];
  /** Formulaire simplifié (sans notes, sans zone) */
  simplifiedForm: boolean;
  /** Afficher le menu */
  showMenu: boolean;
  /** Afficher les avis */
  showReviews: boolean;
  /** Langue par défaut */
  defaultLocale: string;
  /** Largeur du widget (px ou %) */
  width: string;
  /** Hauteur du widget (px ou %) */
  height: string;
  /** Border */
  borderWidth: number;
  borderColor: string;
};

// --------------------------------------------------------------------------
// Configuration par défaut
// --------------------------------------------------------------------------

const DEFAULT_THEME: WidgetTheme = {
  primaryColor: "C9A96E", // brass
  secondaryColor: "2A5A6E", // lagoon
  backgroundColor: "0A1A1F", // deep
  textColor: "E8DDD3", // shell
  fontFamily: "system-ui, -apple-system, sans-serif",
  borderRadius: 16,
  logoUrl: null,
  title: "Réserver une table",
  subtitle: "",
};

// --------------------------------------------------------------------------
// CRUD Configuration
// --------------------------------------------------------------------------

export async function getWidgetConfig(
  restaurantId: string,
): Promise<WidgetConfig> {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      brandColor: true,
      locale: true,
    },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  // Récupérer la config personnalisée si elle existe
  const settings = await db.restaurantSettings.findUnique({
    where: { restaurantId },
    select: { widgetConfig: true },
  });

  const customConfig = (settings?.widgetConfig as Record<string, unknown>) ?? {};

  const theme: WidgetTheme = {
    ...DEFAULT_THEME,
    ...(customConfig.theme as Partial<WidgetTheme> ?? {}),
    logoUrl: restaurant.logoUrl ?? (customConfig.theme as WidgetTheme)?.logoUrl ?? null,
    primaryColor: restaurant.brandColor ?? DEFAULT_THEME.primaryColor,
  };

  return {
    id: `widget-${restaurant.slug}`,
    restaurantId: restaurant.id,
    slug: restaurant.slug,
    theme,
    zones: (customConfig.zones as string[]) ?? ["terrasse", "salle", "salon"],
    simplifiedForm: (customConfig.simplifiedForm as boolean) ?? false,
    showMenu: (customConfig.showMenu as boolean) ?? true,
    showReviews: (customConfig.showReviews as boolean) ?? true,
    defaultLocale: restaurant.locale ?? "fr",
    width: (customConfig.width as string) ?? "100%",
    height: (customConfig.height as string) ?? "600px",
    borderWidth: (customConfig.borderWidth as number) ?? 0,
    borderColor: (customConfig.borderColor as string) ?? "transparent",
  };
}

export async function updateWidgetConfig(
  restaurantId: string,
  updates: Partial<Omit<WidgetConfig, "id" | "restaurantId" | "slug">>,
): Promise<WidgetConfig> {
  const jsonConfig = updates as unknown as Prisma.InputJsonValue;
  await db.restaurantSettings.upsert({
    where: { restaurantId },
    create: {
      restaurantId,
      widgetConfig: jsonConfig,
    },
    update: {
      widgetConfig: jsonConfig,
    },
  });

  return getWidgetConfig(restaurantId);
}

// --------------------------------------------------------------------------
// Génération du code d'intégration
// --------------------------------------------------------------------------

export function generateEmbedCode(
  config: WidgetConfig,
  options: { origin?: string } = {},
): string {
  const origin = options.origin ?? "https://zanzibar.lounge";
  const src = `${origin}/widget/${config.slug}`;

  const params = new URLSearchParams();
  if (config.theme.primaryColor !== DEFAULT_THEME.primaryColor) {
    params.set("color", config.theme.primaryColor);
  }
  if (config.theme.backgroundColor !== DEFAULT_THEME.backgroundColor) {
    params.set("bg", config.theme.backgroundColor);
  }
  if (config.simplifiedForm) {
    params.set("simple", "1");
  }
  if (config.defaultLocale !== "fr") {
    params.set("locale", config.defaultLocale);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  return `<!-- Réservation ${config.slug} -->
<iframe
  src="${src}${query}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"
  style="border: ${config.borderWidth}px solid ${config.borderColor}; border-radius: ${config.theme.borderRadius}px; max-width: 100%;"
  loading="lazy"
  title="Réserver une table — ${config.theme.title}"
></iframe>`;
}

// --------------------------------------------------------------------------
// CSS Variables pour le thème
// --------------------------------------------------------------------------

export function themeToCSS(theme: WidgetTheme): string {
  return `
    --widget-primary: #${theme.primaryColor};
    --widget-secondary: #${theme.secondaryColor};
    --widget-bg: #${theme.backgroundColor};
    --widget-text: #${theme.textColor};
    --widget-font: ${theme.fontFamily};
    --widget-radius: ${theme.borderRadius}px;
  `.trim();
}

// --------------------------------------------------------------------------
// API helper : réponse pour /api/widget/config
// --------------------------------------------------------------------------

export async function getWidgetConfigResponse(slug: string) {
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, active: true },
  });

  if (!restaurant || !restaurant.active) {
    return null;
  }

  const config = await getWidgetConfig(restaurant.id);

  return {
    name: restaurant.name,
    theme: config.theme,
    zones: config.zones,
    simplifiedForm: config.simplifiedForm,
    showMenu: config.showMenu,
    showReviews: config.showReviews,
    locale: config.defaultLocale,
    embed: generateEmbedCode(config),
  };
}
