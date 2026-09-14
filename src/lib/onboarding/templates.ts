export type MenuTemplate = {
  id: string;
  name: string;
  cuisine: string;
  categories: Array<{
    name: string;
    items: Array<{ name: string; price: number; description?: string }>;
  }>;
};

export const MENU_TEMPLATES: MenuTemplate[] = [
  {
    id: "tunisian",
    name: "Tunisienne",
    cuisine: "Tunisienne",
    categories: [
      {
        name: "Entrées",
        items: [
          { name: "Brik à l'œuf", price: 4000, description: "Brik croustillant farci à l'œuf" },
          { name: "Salade mechouia", price: 3500, description: "Salade de poivrons grillés" },
          { name: "Lablabi", price: 3000, description: "Soupe de pois chiches" },
        ],
      },
      {
        name: "Plats",
        items: [
          { name: "Couscous poisson", price: 14000, description: "Couscous au poisson frais" },
          { name: "Ojja", price: 12000, description: "Œufs pochés en sauce tomate" },
          { name: "Kafteji", price: 10000, description: "Légumes frits avec viande" },
          { name: "Brick au thon", price: 8000 },
        ],
      },
      {
        name: "Desserts",
        items: [
          { name: "Baklava", price: 5000 },
          { name: "Yogourt aux dattes", price: 4000 },
        ],
      },
      {
        name: "Boissons",
        items: [
          { name: "Thé à la menthe", price: 2000 },
          { name: "Jus d'orange pressé", price: 4000 },
          { name: "Café turc", price: 2500 },
        ],
      },
    ],
  },
  {
    id: "italian",
    name: "Italienne",
    cuisine: "Italienne",
    categories: [
      {
        name: "Antipasti",
        items: [
          { name: "Bruschetta", price: 6000, description: "Pain grillé, tomates, basilic" },
          { name: "Carpaccio", price: 9000 },
          { name: "Caprese", price: 8000 },
        ],
      },
      {
        name: "Pâtes",
        items: [
          { name: "Spaghetti carbonara", price: 12000 },
          { name: "Penne arrabbiata", price: 11000 },
          { name: "Risotto aux champignons", price: 14000 },
        ],
      },
      {
        name: "Pizzas",
        items: [
          { name: "Margherita", price: 10000 },
          { name: "Quattro formaggi", price: 13000 },
          { name: "Prosciutto", price: 12000 },
        ],
      },
      {
        name: "Desserts",
        items: [
          { name: "Tiramisu", price: 7000 },
          { name: "Panna cotta", price: 6000 },
        ],
      },
    ],
  },
  {
    id: "japanese",
    name: "Japonaise",
    cuisine: "Japonaise",
    categories: [
      {
        name: "Entrées",
        items: [
          { name: "Edamame", price: 4000 },
          { name: "Miso soup", price: 3000 },
          { name: "Gyoza", price: 6000 },
        ],
      },
      {
        name: "Sushi",
        items: [
          { name: "California roll", price: 10000 },
          { name: "Salmon nigiri (x2)", price: 8000 },
          { name: "Dragon roll", price: 12000 },
        ],
      },
      {
        name: "Plats",
        items: [
          { name: "Ramen", price: 12000 },
          { name: "Donburi", price: 11000 },
        ],
      },
      {
        name: "Desserts",
        items: [
          { name: "Mochi", price: 5000 },
          { name: "Matcha glace", price: 6000 },
        ],
      },
    ],
  },
  {
    id: "french",
    name: "Française",
    cuisine: "Française",
    categories: [
      {
        name: "Entrées",
        items: [
          { name: "Soupe à l'oignon", price: 7000 },
          { name: "Salade niçoise", price: 9000 },
          { name: "Escargots", price: 12000 },
        ],
      },
      {
        name: "Plats",
        items: [
          { name: "Steak-frites", price: 18000 },
          { name: "Coq au vin", price: 16000 },
          { name: "Bouillabaisse", price: 20000 },
        ],
      },
      {
        name: "Desserts",
        items: [
          { name: "Crème brûlée", price: 7000 },
          { name: "Tarte tatin", price: 6000 },
        ],
      },
    ],
  },
  {
    id: "mexican",
    name: "Mexicaine",
    cuisine: "Mexicaine",
    categories: [
      {
        name: "Entrées",
        items: [
          { name: "Guacamole & chips", price: 7000 },
          { name: "Quesadilla", price: 8000 },
        ],
      },
      {
        name: "Plats",
        items: [
          { name: "Tacos (x3)", price: 10000 },
          { name: "Burrito", price: 12000 },
          { name: "Enchiladas", price: 11000 },
        ],
      },
      {
        name: "Boissons",
        items: [
          { name: "Horchata", price: 4000 },
          { name: "Agua fresca", price: 3500 },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): MenuTemplate | undefined {
  return MENU_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateList(): Array<{ id: string; name: string; cuisine: string }> {
  return MENU_TEMPLATES.map((t) => ({ id: t.id, name: t.name, cuisine: t.cuisine }));
}
