import "dotenv/config";

import { Client } from "pg";

/**
 * Effacement des données d'une personne, sur sa demande.
 *
 *   npm run forget -- +21620123456
 *
 * Supprime le client et, par cascade du schéma, ses réservations, ses
 * conversations et ses messages. Irréversible : c'est le but.
 */

const input = process.argv[2];

if (!input) {
  console.error("Usage : npm run forget -- +21620123456");
  process.exit(1);
}

const digits = input.replace(/\D/g, "");
if (digits.length < 8 || digits.length > 15) {
  console.error(`Numéro invalide : ${input}`);
  process.exit(1);
}
const phone = `+${digits}`;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL manquante. Voir .env.example.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

const before = await client.query(
  `SELECT
     (SELECT count(*) FROM "Reservation" r
        JOIN "Guest" g ON g."id" = r."guestId" WHERE g."phone" = $1) AS reservations,
     (SELECT count(*) FROM "Message" m
        JOIN "Conversation" c ON c."id" = m."conversationId"
        JOIN "Guest" g ON g."id" = c."guestId" WHERE g."phone" = $1) AS messages`,
  [phone],
);

const { rowCount } = await client.query(
  `DELETE FROM "Guest" WHERE "phone" = $1`,
  [phone],
);

await client.end();

if (rowCount === 0) {
  console.log(`Aucune donnée pour ${phone}.`);
} else {
  const { reservations, messages } = before.rows[0];
  console.log(
    `${phone} effacé : ${reservations} réservation(s), ${messages} message(s).`,
  );
}
