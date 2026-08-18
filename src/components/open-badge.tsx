import { openStatus } from "@/lib/hours";
import { fill, type Dictionary } from "@/i18n";

/**
 * « Ouvert jusqu'à 02:00 ».
 *
 * C'est l'information la plus demandée à un lounge, et celle qu'aucun site de
 * restaurant n'affiche jamais assez tôt. Elle ouvre donc la page.
 */
export function OpenBadge({
  dictionary,
  className = "",
}: {
  dictionary: Dictionary;
  className?: string;
}) {
  const status = openStatus();

  const label = status.open
    ? fill(dictionary.status.openUntil, { time: status.closesAt })
    : status.today
      ? fill(dictionary.status.opensAt, { time: status.opensAt })
      : fill(dictionary.status.opensDay, {
          day: dictionary.days.long[status.opensWeekday] ?? "",
          time: status.opensAt,
        });

  // Pas de classe d'affichage par défaut : `hidden` et `inline-flex` agissent
  // toutes deux sur `display`, et c'est l'ordre du fichier CSS qui tranche, pas
  // celui de l'attribut. Une base `inline-flex` rendait le `hidden` du parent
  // inopérant et faisait déborder l'en-tête sur mobile. L'appelant décide.
  return (
    <p
      className={`items-center gap-2.5 font-mono text-xs tracking-[0.14em] uppercase ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-2 rounded-full ${
          status.open
            ? "bg-lagoon shadow-[0_0_12px_var(--color-lagoon)]"
            : "bg-coral"
        }`}
      />
      <span className={status.open ? "text-lagoon" : "text-shell-dim"}>
        {label}
      </span>
    </p>
  );
}
