/**
 * La carte. Lue par la page /carte et par l'agent IA quand un client demande
 * « vous avez quoi en jus ? » ou « c'est combien la chicha ? ».
 *
 * ⚠️ TOUTE cette carte est un espace réservé : les intitulés et les prix
 * doivent être remplacés par la carte réelle avant mise en ligne. Les prix
 * sont en dinars tunisiens (TND).
 */

import type { Locale } from "@/i18n/config";

export type Localized = Record<Locale, string>;

export type MenuItem = {
  id: string;
  name: Localized;
  description?: Localized;
  /** Prix en TND. `null` = « prix du jour », affiché comme tel. */
  price: number | null;
  tags?: Array<"vegetarien" | "epice" | "signature" | "sans-alcool">;
};

export type MenuCategory = {
  id: string;
  name: Localized;
  /** Une ligne qui situe la catégorie, affichée sous le titre. */
  note?: Localized;
  items: MenuItem[];
};

export const currency = "TND";

export const menu: MenuCategory[] = [
  {
    id: "cafes",
    name: { fr: "Cafés & thés", ar: "قهوة وشاي", en: "Coffee & tea" },
    note: {
      fr: "Torréfaction du jour, servie jusqu'à la fermeture.",
      ar: "تحميص اليوم، يُقدّم حتى موعد الإغلاق.",
      en: "Today's roast, served until closing.",
    },
    items: [
      {
        id: "express",
        name: { fr: "Express", ar: "إكسبرس", en: "Espresso" },
        price: 2.5,
      },
      {
        id: "cappuccino",
        name: { fr: "Cappuccino", ar: "كابتشينو", en: "Cappuccino" },
        price: 4.5,
      },
      {
        id: "the-menthe",
        name: {
          fr: "Thé à la menthe et pignons",
          ar: "شاي بالنعناع والصنوبر",
          en: "Mint tea with pine nuts",
        },
        price: 4,
        tags: ["signature"],
      },
      {
        id: "chocolat-chaud",
        name: { fr: "Chocolat chaud", ar: "شوكولاتة ساخنة", en: "Hot chocolate" },
        price: 6,
      },
    ],
  },
  {
    id: "jus",
    name: { fr: "Jus & smoothies", ar: "عصائر وسموذي", en: "Juices & smoothies" },
    note: {
      fr: "Fruits pressés à la commande.",
      ar: "فواكه تُعصر عند الطلب.",
      en: "Pressed to order.",
    },
    items: [
      {
        id: "orange",
        name: { fr: "Orange pressée", ar: "عصير برتقال", en: "Fresh orange" },
        price: 6,
        tags: ["sans-alcool"],
      },
      {
        id: "zanzibar",
        name: {
          fr: "Zanzibar — mangue, fruit de la passion, citron vert",
          ar: "زنجبار — مانجو، باشن فروت، ليمون أخضر",
          en: "Zanzibar — mango, passion fruit, lime",
        },
        price: 12,
        tags: ["signature", "sans-alcool"],
      },
      {
        id: "avocat",
        name: {
          fr: "Smoothie avocat-miel",
          ar: "سموذي أفوكادو بالعسل",
          en: "Avocado & honey smoothie",
        },
        price: 11,
        tags: ["vegetarien"],
      },
    ],
  },
  {
    id: "cuisine",
    name: { fr: "À table", ar: "المائدة", en: "The kitchen" },
    items: [
      {
        id: "brick",
        name: { fr: "Brick à l'œuf", ar: "بريك بالبيض", en: "Egg brik" },
        price: 5,
      },
      {
        id: "salade-mechouia",
        name: {
          fr: "Salade mechouia",
          ar: "سلاطة مشوية",
          en: "Mechouia salad",
        },
        description: {
          fr: "Poivrons et tomates grillés, thon, œuf.",
          ar: "فلفل وطماطم مشوية، تن، بيض.",
          en: "Grilled peppers and tomatoes, tuna, egg.",
        },
        price: 9,
        tags: ["epice"],
      },
      {
        id: "burger",
        name: { fr: "Burger Zanzibar", ar: "برغر زنجبار", en: "Zanzibar burger" },
        price: 18,
        tags: ["signature"],
      },
      {
        id: "poisson",
        name: {
          fr: "Poisson du jour grillé",
          ar: "سمك اليوم مشوي",
          en: "Grilled catch of the day",
        },
        price: null,
      },
    ],
  },
  {
    id: "chicha",
    name: { fr: "Chicha", ar: "شيشة", en: "Shisha" },
    note: {
      fr: "Service en terrasse et au salon.",
      ar: "تُقدَّم في التراس والصالون.",
      en: "Served on the terrace and in the lounge.",
    },
    items: [
      {
        id: "classique",
        name: { fr: "Classique", ar: "كلاسيك", en: "Classic" },
        price: 12,
      },
      {
        id: "premium",
        name: {
          fr: "Premium — parfums du jour",
          ar: "بريميوم — نكهات اليوم",
          en: "Premium — today's flavours",
        },
        price: 18,
      },
    ],
  },
  {
    id: "douceurs",
    name: { fr: "Douceurs", ar: "حلويات", en: "Sweets" },
    items: [
      {
        id: "bambalouni",
        name: { fr: "Bambalouni", ar: "بمبالوني", en: "Bambalouni" },
        price: 4,
        tags: ["vegetarien"],
      },
      {
        id: "tiramisu",
        name: { fr: "Tiramisu maison", ar: "تيراميسو بيتي", en: "House tiramisu" },
        price: 9,
        tags: ["vegetarien"],
      },
    ],
  },
];

/** Résumé compact de la carte, injecté dans le prompt de l'agent IA. */
export function menuAsText(locale: Locale): string {
  return menu
    .map((category) => {
      const items = category.items
        .map((item) => {
          const price =
            item.price === null ? "prix du jour" : `${item.price} ${currency}`;
          return `  - ${item.name[locale]} : ${price}`;
        })
        .join("\n");
      return `${category.name[locale]}\n${items}`;
    })
    .join("\n\n");
}
