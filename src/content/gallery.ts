import type { Locale } from "@/i18n/config";

export type Photo = {
  /** Chemin dans /public, par exemple « /galerie/terrasse-01.jpg ». */
  src: string;
  /** Description pour les lecteurs d'écran, dans les trois langues. */
  alt: Record<Locale, string>;
  width: number;
  height: number;
  /** Une photo « haute » occupe deux rangées dans la mosaïque. */
  tall?: boolean;
};

/**
 * Les photos ne sont pas incluses : elles appartiennent à l'établissement.
 *
 * Pour les ajouter — déposer les fichiers dans `public/galerie/`, puis créer
 * une entrée par photo ci-dessous avec ses dimensions réelles (Next en a besoin
 * pour réserver la place et éviter que la page saute au chargement).
 *
 * Tant que ce tableau est vide, la page galerie renvoie vers Instagram plutôt
 * que d'afficher des images d'illustration qui ne seraient pas les vôtres.
 */
export const gallery: Photo[] = [];
