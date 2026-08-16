import "dotenv/config";

import { defineConfig } from "prisma/config";

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
