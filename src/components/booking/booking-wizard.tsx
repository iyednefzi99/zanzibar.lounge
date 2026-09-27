"use client";

import { useState, useCallback } from "react";

import { StepDate } from "@/components/booking/step-date";
import { StepContact } from "@/components/booking/step-contact";
import { StepConfirmation } from "@/components/booking/step-confirm";
import type { Dictionary } from "@/i18n";
import { fill } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type BookingData = {
  date: string;
  minutes: number;
  timeLabel: string;
  partySize: number;
  name: string;
  phone: string;
  zone: "terrasse" | "salle" | "salon" | null;
  notes: string;
};

const steps = ["date", "contact", "confirm"] as const;

export function BookingWizard({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingData>({
    date: "",
    minutes: 0,
    timeLabel: "",
    partySize: 2,
    name: "",
    phone: "",
    zone: null,
    notes: "",
  });

  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, 2)), []);
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const update = useCallback((partial: Partial<BookingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <form
      className="relative"
      onSubmit={(event) => event.preventDefault()}
    >
      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={step + 1}
        aria-valuetext={fill(dictionary.booking.progress, {
          current: step + 1,
          total: steps.length,
        })}
        aria-label={dictionary.booking.title}
        className="mb-10 flex items-center justify-center gap-3"
      >
        <ol className="contents">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <div
                aria-current={i === step ? "step" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                  i < step
                    ? "bg-brass text-deep"
                    : i === step
                      ? "border-2 border-brass text-brass"
                      : "border border-shell/20 text-shell-dim"
                }`}
              >
                {i < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <>
                    <span className="sr-only">
                      {fill(dictionary.booking.progress, {
                        current: i + 1,
                        total: steps.length,
                      })}
                    </span>
                    <span aria-hidden="true">{i + 1}</span>
                  </>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`h-px w-12 transition-colors ${
                    i < step ? "bg-brass" : "bg-shell/20"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Steps */}
      {step === 0 && (
        <StepDate
          locale={locale}
          dictionary={dictionary}
          data={data}
          onUpdate={update}
          onNext={goNext}
        />
      )}
      {step === 1 && (
        <StepContact
          locale={locale}
          dictionary={dictionary}
          data={data}
          onUpdate={update}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {step === 2 && (
        <StepConfirmation
          locale={locale}
          dictionary={dictionary}
          data={data}
          onBack={goBack}
        />
      )}
    </form>
  );
}
