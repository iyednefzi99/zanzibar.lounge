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
    name: { fr: "Cafés & thés", ar: "قهوة وشاي", en: "Coffee & tea", de: "Kaffee & Tee", es: "Cafés y tés", it: "Caffè e tè", pt: "Cafés e chás", ru: "Кофе и чай", zh: "咖啡和茶", ja: "コーヒー＆紅茶" },
    note: {
      fr: "Torréfaction du jour, servie jusqu'à la fermeture.",
      ar: "تحميص اليوم، يُقدّم حتى موعد الإغلاق.",
      en: "Today's roast, served until closing.",
      de: "Tagesfrischung, serviert bis zum Schließen.",
      es: "Tueste del día, servido hasta el cierre.",
      it: "Torrizione del giorno, servita fino alla chiusura.",
      pt: "Torra do dia, servida até o fechamento.",
      ru: "Обжарка дня, подаётся до закрытия.",
      zh: "每日烘焙，供应至打烊。",
      ja: "本日のロースト、閉店まで提供。",
    },
    items: [
      {
        id: "express",
        name: { fr: "Express", ar: "إكسبرس", en: "Espresso", de: "Espresso", es: "Espresso", it: "Espresso", pt: "Espresso", ru: "Эспрессо", zh: "浓缩咖啡", ja: "エスプレッソ" },
        price: 2.5,
      },
      {
        id: "cappuccino",
        name: { fr: "Cappuccino", ar: "كابتشينو", en: "Cappuccino", de: "Cappuccino", es: "Capuchino", it: "Cappuccino", pt: "Cappuccino", ru: "Капучино", zh: "卡布奇诺", ja: "カプチーノ" },
        price: 4.5,
      },
      {
        id: "the-menthe",
        name: {
          fr: "Thé à la menthe et pignons",
          ar: "شاي بالنعناع والصنوبر",
          en: "Mint tea with pine nuts",
          de: "Minze-Tee mit Pinienkernen",
          es: "Té de menta con piñones",
          it: "Tè alla mentha con pinoli",
          pt: "Chá de menta com pinhão",
          ru: "Мятный чай с кедровыми орехами",
          zh: "薄荷松子茶",
          ja: "ピーナッツ入りミントティー",
        },
        price: 4,
        tags: ["signature"],
      },
      {
        id: "chocolat-chaud",
        name: { fr: "Chocolat chaud", ar: "شوكولاتة ساخنة", en: "Hot chocolate", de: "Heißschokolade", es: "Chocolate caliente", it: "Cioccolata calda", pt: "Chocolate quente", ru: "Горячий шоколад", zh: "热巧克力", ja: "ホットチョコレート" },
        price: 6,
      },
    ],
  },
  {
    id: "jus",
    name: { fr: "Jus & smoothies", ar: "عصائر وسموذي", en: "Juices & smoothies", de: "Säfte & Smoothies", es: "Zumos y batidos", it: "Succhi e frullati", pt: "Sucos e smoothies", ru: "Соки и смузи", zh: "果汁和冰沙", ja: "ジュース＆スムージー" },
    note: {
      fr: "Fruits pressés à la commande.",
      ar: "فواكه تُعصر عند الطلب.",
      en: "Pressed to order.",
      de: "Frisch gepresst auf Bestellung.",
      es: "Recién exprimidos.",
      it: "Spremuti al momento.",
      pt: "Feitos na hora.",
      ru: "Выжаты на заказ.",
      zh: "现榨现做。",
      ja: "オーダーで搾ります。",
    },
    items: [
      {
        id: "orange",
        name: { fr: "Orange pressée", ar: "عصير برتقال", en: "Fresh orange", de: "Frisch gepresster Orangensaft", es: "Zumo de naranja recién exprimido", it: "Spremuta d'arancia", pt: "Suco de laranja fresco", ru: "Свежевыжатый апельсиновый сок", zh: "鲜榨橙汁", ja: "プレスオレンジ" },
        price: 6,
        tags: ["sans-alcool"],
      },
      {
        id: "zanzibar",
        name: {
          fr: "Zanzibar — mangue, fruit de la passion, citron vert",
          ar: "زنجبار — مانجو، باشن فروت، ليمون أخضر",
          en: "Zanzibar — mango, passion fruit, lime",
          de: "Zanzibar — Mango, Maracuja, Limette",
          es: "Zanzibar — mango, maracuyá, lima",
          it: "Zanzibar — mango, frutto della passione, lime",
          pt: "Zanzibar — manga, maracujá, limão",
          ru: "Занзибар — манго, маракуйя, лайм",
          zh: "桑给巴尔 — 芒果、百香果、青柠",
          ja: "ザンジバー — マンゴー、パッションフルーツ、ライム",
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
          de: "Avocado-Honig-Smoothie",
          es: "Batido de aguacate y miel",
          it: "Frullato di avocado e miele",
          pt: "Smoothie de abacate e mel",
          ru: "Смузи авокадо с мёдом",
          zh: "牛油果蜂蜜冰沙",
          ja: "アボカド＆ハニー スムージー",
        },
        price: 11,
        tags: ["vegetarien"],
      },
    ],
  },
  {
    id: "cuisine",
    name: { fr: "À table", ar: "المائدة", en: "The kitchen", de: "In der Küche", es: "A la mesa", it: "In tavola", pt: "Na mesa", ru: "За столом", zh: "用餐", ja: "食事" },
    items: [
      {
        id: "brick",
        name: { fr: "Brick à l'œuf", ar: "بريك بالبيض", en: "Egg brik", de: "Ei-Brik", es: "Brik de huevo", it: "Brik all'uovo", pt: "Brik de ovo", ru: "Брик с яйцом", zh: "鸡蛋布里克", ja: "エッグブリック" },
        price: 5,
      },
      {
        id: "salade-mechouia",
        name: {
          fr: "Salade mechouia",
          ar: "سلاطة مشوية",
          en: "Mechouia salad",
          de: "Mechouia-Salat",
          es: "Ensalada mechouia",
          it: "Insalata mechouia",
          pt: "Salada mechouia",
          ru: "Салат mechouia",
          zh: "烤沙拉",
          ja: "メシュイアサラダ",
        },
        description: {
          fr: "Poivrons et tomates grillés, thon, œuf.",
          ar: "فلفل وطماطم مشوية، تن، بيض.",
          en: "Grilled peppers and tomatoes, tuna, egg.",
          de: "Gegrillte Paprika und Tomaten, Thunfisch, Ei.",
          es: "Pimientos y tomates a la parrilla, atún, huevo.",
          it: "Peperoni e pomodori grigliati, tonno, uovo.",
          pt: "Pimentões e tomates grelhados, atum, ovo.",
          ru: "Гриль перец и помидоры, тунец, яйцо.",
          zh: "烤甜椒和番茄、金枪鱼、鸡蛋。",
          ja: "焼きピーマンとトマト、マグロ、卵。",
        },
        price: 9,
        tags: ["epice"],
      },
      {
        id: "burger",
        name: { fr: "Burger Zanzibar", ar: "برغر زنجبار", en: "Zanzibar burger", de: "Zanzibar-Burger", es: "Hamburguesa Zanzibar", it: "Hamburger Zanzibar", pt: "Hambúrguer Zanzibar", ru: "Бургер Занзибар", zh: "桑给巴尔汉堡", ja: "ザンジバーガー" },
        price: 18,
        tags: ["signature"],
      },
      {
        id: "poisson",
        name: {
          fr: "Poisson du jour grillé",
          ar: "سمك اليوم مشوي",
          en: "Grilled catch of the day",
          de: "Gegrillter Tagesfang",
          es: "Pescado del día a la parrilla",
          it: "Pesce del giorno grigliato",
          pt: "Peixe do dia grelhado",
          ru: "Жареная рыба дня",
          zh: "今日烤鱼",
          ja: "本日の焼き魚",
        },
        price: null,
      },
    ],
  },
  {
    id: "chicha",
    name: { fr: "Chicha", ar: "شيشة", en: "Shisha", de: "Shisha", es: "Narguilé", it: "Narghilè", pt: "Narguilé", ru: "Кальян", zh: "水烟", ja: "シーザー" },
    note: {
      fr: "Service en terrasse et au salon.",
      ar: "تُقدَّم في التراس والصالون.",
      en: "Served on the terrace and in the lounge.",
      de: "Auf der Terrasse und im Lounge serviert.",
      es: "Se sirve en la terraza y en el salón.",
      it: "Servito in terrazza e nel salotto.",
      pt: "Servido na terrazza e na lounge.",
      ru: "Подаётся на террасе и в лаунже.",
      zh: "在露台和休息室供应。",
      ja: "テラスとラウンジで提供。",
    },
    items: [
      {
        id: "classique",
        name: { fr: "Classique", ar: "كلاسيك", en: "Classic", de: "Klassisch", es: "Clásico", it: "Classico", pt: "Clássico", ru: "Классический", zh: "经典", ja: "クラシック" },
        price: 12,
      },
      {
        id: "premium",
        name: {
          fr: "Premium — parfums du jour",
          ar: "بريميوم — نكهات اليوم",
          en: "Premium — today's flavours",
          de: "Premium — Tagesgeschmack",
          es: "Premium — sabores del día",
          it: "Premium — sapori del giorno",
          pt: "Premium — sabores do dia",
          ru: "Премиум — вкусы дня",
          zh: "高级 — 今日口味",
          ja: "プレミアム — 本日のフレーバー",
        },
        price: 18,
      },
    ],
  },
  {
    id: "douceurs",
    name: { fr: "Douceurs", ar: "حلويات", en: "Sweets", de: "Süßigkeiten", es: "Dulces", it: "Dolci", pt: "Doces", ru: "Сладости", zh: "甜品", ja: "デザート" },
    items: [
      {
        id: "bambalouni",
        name: { fr: "Bambalouni", ar: "بمبالوني", en: "Bambalouni", de: "Bambalouni", es: "Bambalouni", it: "Bambalouni", pt: "Bambalouni", ru: "Бамбалуни", zh: "班巴鲁尼", ja: "バンバラウニ" },
        price: 4,
        tags: ["vegetarien"],
      },
      {
        id: "tiramisu",
        name: { fr: "Tiramisu maison", ar: "تيراميسو بيتي", en: "House tiramisu", de: "Hausgemachter Tiramisu", es: "Tiramisú casero", it: "Tiramisù della casa", pt: "Tiramisù caseiro", ru: "Домашний тирамису", zh: "自制提拉米苏", ja: "自家製ティラミス" },
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
