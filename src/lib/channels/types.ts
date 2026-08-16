import type { Channel } from "@/generated/prisma/client";

export type InboundMessage = {
  channel: Channel;
  /** Numéro de l'expéditeur, normalisé en E.164. */
  from: string;
  body: string;
  /** Identifiant du message chez le fournisseur — sert à la déduplication. */
  providerId: string;
};

export type SendResult =
  | { ok: true; providerId: string | null }
  | { ok: false; reason: string };

export class ChannelNotConfiguredError extends Error {
  constructor(channel: Channel) {
    super(`Canal ${channel} non configuré : variables d'environnement manquantes.`);
    this.name = "ChannelNotConfiguredError";
  }
}
