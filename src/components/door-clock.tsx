import { OpenBadge } from "@/components/open-badge";
import type { Dictionary } from "@/i18n";
import { activeService } from "@/lib/hours";
import { minutesToHM } from "@/lib/time";

/**
 * Le cadran de la porte.
 *
 * L'arche de Stone Town, et dedans le service du jour tracé de haut en bas :
 * la barre de laiton court de l'ouverture à la fermeture, la partie pleine est
 * ce qui s'est écoulé, le point lagon est l'instant présent. C'est la seule
 * question qu'on se pose avant de sortir — « c'est ouvert, et jusqu'à quand ? »
 * — répondue par la forme autant que par la phrase qui la sous-titre.
 *
 * La page est rendue à la demande (`force-dynamic`), donc l'instant affiché est
 * toujours juste. Rien de tout cela n'envoie de JavaScript au client.
 */
export function DoorClock({
  dictionary,
  className = "",
}: {
  dictionary: Dictionary;
  className?: string;
}) {
  const service = activeService();

  return (
    <div className={`relative mx-auto w-full max-w-sm ${className}`}>
      <div className="arch relative aspect-[3/4] w-full border border-brass/50 bg-gradient-to-b from-deep via-night to-clove/40">
        <div className="arch absolute inset-3 border border-brass/25" />

        {/* La clé de voûte. */}
        <p
          aria-hidden="true"
          className="absolute inset-x-0 top-[10%] text-center font-display text-5xl leading-none text-brass/90"
        >
          ز
        </p>

        {service && (
          <ServiceRail
            open={service.window.open}
            close={service.window.close}
            nowMinutes={service.nowMinutes}
            nowLabel={dictionary.status.now}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 flex justify-center p-7">
          <OpenBadge dictionary={dictionary} className="inline-flex" />
        </div>
      </div>
    </div>
  );
}

/**
 * La barre du service.
 *
 * Trois colonnes, dans cet ordre logique : l'échelle des heures, la barre,
 * puis l'étiquette de l'instant. Les deux colonnes de texte ont la même
 * largeur, ce qui place la barre au milieu exact de l'arche. En lecture de
 * droite à gauche, le sens du `flex` les remet d'elles-mêmes du bon côté.
 */
function ServiceRail({
  open,
  close,
  nowMinutes,
  nowLabel,
}: {
  open: number;
  close: number;
  nowMinutes: number | null;
  nowLabel: string;
}) {
  const span = close - open;
  const at = (minutes: number) =>
    `${(((minutes - open) / span) * 100).toFixed(2)}%`;

  // Une encoche toutes les deux heures, alignée sur les heures rondes : c'est
  // l'échelle qui donne sa profondeur à la barre, pas une graduation à lire.
  const ticks: number[] = [];
  for (let m = Math.ceil(open / 120) * 120; m < close; m += 120) ticks.push(m);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-[22%] bottom-[20%] flex justify-center"
    >
      <div className="relative flex h-full gap-3">
        {/* L'échelle : les deux bornes du service, et les encoches. */}
        <div className="relative w-20 text-end font-mono text-[0.6rem] tracking-[0.12em] text-shell-dim/80 tabular-nums">
          <span dir="ltr" className="absolute end-0 top-0 -translate-y-1/2">
            {minutesToHM(open)}
          </span>
          <span dir="ltr" className="absolute end-0 bottom-0 translate-y-1/2">
            {minutesToHM(close)}
          </span>
          {ticks.map((minute) => (
            <span
              key={minute}
              className="absolute end-0 h-px w-2 bg-shell/20"
              style={{ top: at(minute) }}
            />
          ))}
        </div>

        {/* La barre. Creuse pour ce qui reste, pleine pour ce qui est passé. */}
        <div className="relative w-[3px] rounded-full bg-shell/20">
          {nowMinutes !== null && (
            <>
              <span
                className="rail-fill absolute inset-x-0 top-0 rounded-full bg-brass"
                style={{ height: at(nowMinutes) }}
              />
              <span
                className="absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lagoon shadow-[0_0_14px_var(--color-lagoon)]"
                style={{ top: at(nowMinutes) }}
              />
            </>
          )}
        </div>

        {/* L'étiquette de l'instant, en regard du point. */}
        <div className="relative w-20">
          {nowMinutes !== null && (
            <span
              className="absolute start-0 -translate-y-1/2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-lagoon"
              style={{ top: at(nowMinutes) }}
            >
              {nowLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
