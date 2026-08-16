import "dotenv/config";

import { Client } from "pg";

/**
 * Plan de salle initial.
 *
 * Écrit en SQL et en JavaScript plutôt qu'avec le client Prisma : c'est un
 * script ponctuel, lancé par un humain avant la première mise en service, et
 * il n'a aucune raison d'exiger une étape de compilation.
 *
 * ⚠️ Ces tables sont un point de départ plausible, pas le vrai plan. À ajuster
 * aux noms et capacités réels. Tant qu'aucune table n'existe, les réservations
 * restent acceptées : seule la capacité globale s'applique, et le placement se
 * règle en salle.
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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL manquante. Voir .env.example.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

let count = 0;

for (const group of layout) {
  for (let index = 1; index <= group.count; index += 1) {
    const name = `${prefix[group.zone]}${group.capacity}-${index}`;
    await client.query(
      `INSERT INTO "RestaurantTable" ("id", "name", "capacity", "zone", "active")
       VALUES (gen_random_uuid()::text, $1, $2, $3::"Zone", true)
       ON CONFLICT ("name")
       DO UPDATE SET "capacity" = EXCLUDED."capacity", "zone" = EXCLUDED."zone"`,
      [name, group.capacity, group.zone],
    );
    count += 1;
  }
}

await client.end();
console.log(`${count} tables en place.`);
