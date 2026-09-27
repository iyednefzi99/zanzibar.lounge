import { OpenBadge } from "@/components/ui/open-badge";
import type { Dictionary } from "@/i18n";
import { activeService } from "@/lib/hours";

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
      <div className="relative aspect-[3/4] w-full border border-brass/45 bg-gradient-to-b from-deep via-night to-clove/40">
        <div className="absolute inset-3 border border-brass/20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent" />

        <p
          aria-hidden="true"
          className="absolute inset-x-0 top-[10%] text-center font-display text-5xl leading-none text-brass/90"
        >
          ز
        </p>

        {service && (
          <div className="absolute inset-x-0 top-[35%] flex justify-center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-shell-dim">
                {dictionary.status.now}
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex justify-center p-7">
          <OpenBadge dictionary={dictionary} className="inline-flex" />
        </div>
      </div>
    </div>
  );
}
