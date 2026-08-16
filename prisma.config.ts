import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Même ordre de priorité que Next : `.env.local` d'abord, `.env` en repli.
// dotenv n'écrase pas une variable déjà définie, donc le premier chargé gagne.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

/**
 * Configuration Prisma 7.
 *
 * Depuis la version 7, l'URL de connexion ne figure plus dans le schéma : les
 * commandes de migration la lisent ici, et le client applicatif la reçoit via
 * son adaptateur (src/lib/db.ts). Une seule source, `DATABASE_URL`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
