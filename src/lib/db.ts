import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Un seul client Prisma par processus.
 *
 * En développement, Next recharge les modules à chaque édition : sans ce cache
 * global on ouvrirait une nouvelle réserve de connexions à chaque sauvegarde,
 * jusqu'à saturer la base.
 *
 * Depuis Prisma 7, la connexion passe par un adaptateur de pilote : l'URL ne
 * vient plus du schéma mais d'ici — et de prisma.config.ts pour les migrations.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL manquante : impossible de joindre la base. Voir .env.example.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Client paresseux : rien ne se connecte tant qu'aucune requête n'est faite.
 *
 * C'est ce qui permet à `next build` d'importer les routes d'API sans exiger
 * de base de données, et à la vitrine de fonctionner en local sans Postgres.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = (globalForPrisma.prisma ??= createClient());
    const value = client[property as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
