import crypto from "node:crypto";

import { headers } from "next/headers";

/**
 * Autorisation du back-office, côté serveur.
 *
 * Le proxy filtre déjà les requêtes vers `/{langue}/admin`, mais ce n'est pas
 * une frontière suffisante : l'identifiant d'une action serveur Next est valable
 * pour l'ensemble du build, si bien qu'un POST vers une page publique portant
 * l'en-tête `Next-Action` exécuterait l'action sans jamais traverser le proxy.
 *
 * Chaque action et chaque page du back-office revérifie donc l'identité ici,
 * à partir du même en-tête `Authorization` que le navigateur renvoie
 * spontanément une fois l'authentification Basic acceptée.
 */

export class AdminForbiddenError extends Error {
  constructor(reason: string) {
    super(`Accès back-office refusé : ${reason}`);
    this.name = "AdminForbiddenError";
  }
}

/** Vrai si la requête courante porte des identifiants d'administration valides. */
export async function isAdmin(): Promise<boolean> {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password) return false;

  const header = (await headers()).get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  return (
    timingSafeEqual(decoded.slice(0, separator), user) &&
    timingSafeEqual(decoded.slice(separator + 1), password)
  );
}

/**
 * À appeler en tête de toute action serveur du back-office. Lève plutôt que de
 * renvoyer un booléen : un appelant qui oublierait de tester le retour se
 * retrouverait avec une mutation ouverte, alors qu'une exception interrompt.
 */
export async function requireAdmin(): Promise<void> {
  if (await isAdmin()) return;

  const configured = Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
  console.warn("[admin] action refusée", {
    raison: configured ? "identifiants invalides" : "back-office non configuré",
  });

  throw new AdminForbiddenError(
    configured ? "identifiants invalides" : "back-office non configuré",
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // Pad le plus court pour éviter le timing leak sur la longueur
  const maxLen = Math.max(left.length, right.length);
  const leftPadded = Buffer.alloc(maxLen, 0);
  const rightPadded = Buffer.alloc(maxLen, 0);
  left.copy(leftPadded);
  right.copy(rightPadded);
  return crypto.timingSafeEqual(leftPadded, rightPadded);
}
