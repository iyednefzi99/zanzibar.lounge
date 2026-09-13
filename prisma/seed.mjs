import { config } from "dotenv";
import { Client } from "pg";

// Même ordre de priorité que Next : `.env.local` d'abord, `.env` en repli.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

/**
 * Plan de salle initial + restaurant par défaut + menu.
 *
 * Écrit en SQL et en JavaScript plutôt qu'avec le client Prisma : c'est un
 * script ponctuel, lancé par un humain avant la première mise en service, et
 * il n'a aucune raison d'exiger une étape de compilation.
 */

const layout = [
  { zone: "TERRASSE", capacity: 2, count: 4 },
  { zone: "TERRASSE", capacity: 4, count: 3 },
  { zone: "TERRASSE", capacity: 6, count: 1 },
  { zone: "SALLE", capacity: 2, count: 3 },
  { zone: "SALLE", capacity: 4, count: 4 },
  { zone: "SALLE", capacity: 8, count: 1 },
  { zone: "SALON", capacity: 4, count: 2 },
  { zone: "SALON", capacity: 6, count: 1 },
];

const prefix = { TERRASSE: "T", SALLE: "S", SALON: "L" };

/**
 * Menu seed — prix en millimes (1 TND = 1000 millimes).
 * Catégories mappées depuis src/content/menu.ts.
 */
const menuItems = [
  // Cafés & thés
  { name: "Express", description: null, price: 2500, category: "boisson", sortOrder: 1 },
  { name: "Cappuccino", description: null, price: 4500, category: "boisson", sortOrder: 2 },
  { name: "Thé à la menthe et pignons", description: "Signature", price: 4000, category: "boisson", sortOrder: 3 },
  { name: "Chocolat chaud", description: null, price: 6000, category: "boisson", sortOrder: 4 },
  // Jus & smoothies
  { name: "Orange pressée", description: "Fruits pressés à la commande", price: 6000, category: "boisson", sortOrder: 5 },
  { name: "Zanzibar — mangue, passion, citron vert", description: "Signature", price: 12000, category: "boisson", sortOrder: 6 },
  { name: "Smoothie avocat-miel", description: null, price: 11000, category: "boisson", sortOrder: 7 },
  // À table
  { name: "Brick à l'œuf", description: null, price: 5000, category: "plat", sortOrder: 1 },
  { name: "Salade mechouia", description: "Poivrons et tomates grillés, thon, œuf", price: 9000, category: "plat", sortOrder: 2 },
  { name: "Burger Zanzibar", description: "Signature", price: 18000, category: "plat", sortOrder: 3 },
  // Chicha
  { name: "Chicha classique", description: null, price: 12000, category: "general", sortOrder: 1 },
  { name: "Chicha premium — parfums du jour", description: null, price: 18000, category: "general", sortOrder: 2 },
  // Douceurs
  { name: "Bambalouni", description: null, price: 4000, category: "dessert", sortOrder: 1 },
  { name: "Tiramisu maison", description: null, price: 9000, category: "dessert", sortOrder: 2 },
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL manquante. Voir .env.example.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

let count = 0;

// 1. Restaurant par défaut
const restaurantResult = await client.query(
  `INSERT INTO "Restaurant" ("id", "name", "slug", "address", "phone", "timezone", "locale", "active", "createdAt", "updatedAt")
   VALUES (gen_random_uuid()::text, 'Zanzibar Lounge', 'zanzibar', 'Medjez el Bab, Tunisie', '+21620123456', 'Africa/Tunis', 'fr', true, NOW(), NOW())
   ON CONFLICT ("slug")
   DO UPDATE SET "name" = EXCLUDED."name"
   RETURNING "id"`,
);
const restaurantId = restaurantResult.rows[0].id;
console.log(`Restaurant « Zanzibar Lounge » (${restaurantId}).`);

// 2. Tables
for (const group of layout) {
  for (let index = 1; index <= group.count; index += 1) {
    const name = `${prefix[group.zone]}${group.capacity}-${index}`;
    await client.query(
      `INSERT INTO "RestaurantTable" ("id", "restaurantId", "name", "capacity", "zone", "active")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::"Zone", true)
       ON CONFLICT ("restaurantId", "name")
       DO UPDATE SET "capacity" = EXCLUDED."capacity", "zone" = EXCLUDED."zone"`,
      [restaurantId, name, group.capacity, group.zone],
    );
    count += 1;
  }
}
console.log(`${count} tables en place.`);

// 3. Menu
let menuCount = 0;
for (const item of menuItems) {
  await client.query(
    `INSERT INTO "MenuItem" ("id", "restaurantId", "name", "description", "price", "category", "available", "sortOrder", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, $6, NOW(), NOW())
     ON CONFLICT ("restaurantId", "name")
     DO UPDATE SET "price" = EXCLUDED."price", "description" = EXCLUDED."description"`,
    [restaurantId, item.name, item.description, item.price, item.category, item.sortOrder],
  );
  menuCount += 1;
}
console.log(`${menuCount} articles de menu en place.`);

await client.end();
