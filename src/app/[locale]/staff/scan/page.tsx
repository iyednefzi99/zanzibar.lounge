"use client";

import { useState, useRef, useEffect } from "react";

import { scanCheckinAction } from "../actions";

declare global {
  interface BarcodeDetector {
    detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
  }
  interface BarcodeDetectorOptions {
    formats?: string[];
  }
  var BarcodeDetector: {
    new (options?: BarcodeDetectorOptions): BarcodeDetector;
    getSupportedFormats(): Promise<string[]>;
  };
}

type ScanResult =
  | { status: "idle" }
  | { status: "scanning" }
  | {
      status: "found";
      reference: string;
      name: string | null;
      partySize: number;
      time: string;
      zone: string | null;
      table: string | null;
      seated: boolean;
    }
  | { status: "error"; message: string }
  | { status: "checking" };

export default function StaffScanPage() {
  const [scanState, setScanState] = useState<ScanResult>({ status: "idle" });
  const [checkinState, setCheckinState] = useState<{ error: string } | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  function stopCamera() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function processScanResult(raw: string) {
    stopCamera();

    const match = raw.match(/ZL-[A-Z0-9]{4}/i);
    const reference = match ? match[0].toUpperCase() : raw.trim();

    setScanState({ status: "checking" });

    fetch(`/api/staff/lookup?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) {
          setScanState({
            status: "error",
            message: json.error ?? "Référence introuvable.",
          });
          return;
        }

        const r = json.data;
        setScanState({
          status: "found",
          reference: r.reference,
          name: r.name,
          partySize: r.partySize,
          time: r.time,
          zone: r.zone,
          table: r.table,
          seated: r.seated,
        });
      })
      .catch(() => {
        setScanState({
          status: "error",
          message: "Erreur lors de la lecture.",
        });
      });
  }

  function scanLoop() {
    if (!videoRef.current || !detectorRef.current) return;

    detectorRef.current
      .detect(videoRef.current)
      .then((results: Array<{ rawValue: string }>) => {
        if (results.length > 0) {
          processScanResult(results[0].rawValue);
        } else {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      })
      .catch(() => {
        animFrameRef.current = requestAnimationFrame(scanLoop);
      });
  }

  async function startCamera() {
    setScanState({ status: "scanning" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ("BarcodeDetector" in globalThis) {
        detectorRef.current = new globalThis.BarcodeDetector({
          formats: ["qr_code"],
        });
      }

      scanLoop();
    } catch {
      stopCamera();
      setScanState({
        status: "error",
        message: "Impossible d'accéder à la caméra.",
      });
    }
  }

  function handleManualInput(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ref = form.get("reference");
    if (typeof ref === "string" && ref.trim()) {
      processScanResult(ref.trim());
    }
  }

  async function handleCheckin(reference: string) {
    setCheckinState(null);
    const formData = new FormData();
    formData.set("reference", reference);
    const result = await scanCheckinAction(null, formData);
    if (result?.error) {
      setCheckinState(result);
    } else {
      setScanState({ status: "idle" });
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 font-display text-2xl text-shell">Scanner QR</h1>

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-shell/10 bg-deep/60">
        <video
          ref={videoRef}
          className="aspect-[4/3] w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {scanState.status === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-48 rounded-2xl border-2 border-brass/60" />
            <div className="absolute top-1/2 left-1/2 h-0.5 w-3/4 -translate-x-1/2 -translate-y-1/2 bg-brass/40" />
          </div>
        )}

        {scanState.status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-deep/80">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-16 text-shell-dim"
            >
              <path d="M3 7V5a2 2 0 012-2h2" />
              <path d="M17 3h2a2 2 0 012 2v2" />
              <path d="M21 17v2a2 2 0 01-2 2h-2" />
              <path d="M7 21H5a2 2 0 01-2-2v-2" />
            </svg>
            <button
              onClick={startCamera}
              className="inline-flex h-14 items-center rounded-xl bg-brass px-6 font-medium text-deep transition-colors hover:bg-brass/90"
            >
              Activer la caméra
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleManualInput} className="mb-6 flex gap-2">
        <input
          name="reference"
          type="text"
          placeholder="ZL-XXXX"
          autoComplete="off"
          className="h-12 flex-1 rounded-xl border border-shell/20 bg-deep/60 px-4 font-mono text-shell uppercase placeholder-shell-dim/40 outline-none transition-colors focus:border-brass"
        />
        <button
          type="submit"
          className="h-12 rounded-xl bg-brass px-5 font-medium text-deep transition-colors hover:bg-brass/90"
        >
          Rechercher
        </button>
      </form>

      {scanState.status === "checking" && (
        <div className="rounded-xl border border-brass/20 bg-deep/40 p-6 text-center">
          <p className="text-sm text-shell-dim">Recherche en cours…</p>
        </div>
      )}

      {scanState.status === "error" && (
        <div className="rounded-xl border border-coral/30 bg-coral/5 p-6 text-center">
          <p className="text-sm text-coral">{scanState.message}</p>
          <button
            onClick={() => setScanState({ status: "idle" })}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-shell/25 px-4 text-sm text-shell hover:border-brass hover:text-brass"
          >
            Réessayer
          </button>
        </div>
      )}

      {scanState.status === "found" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-lagoon/30 bg-lagoon/5 p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className="font-mono text-lg tabular-nums text-shell"
                dir="ltr"
              >
                {scanState.time}
              </span>
              <span className="text-sm text-shell">
                {scanState.name ?? "—"} · {scanState.partySize} pers.
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-shell-dim">
              <span className="font-mono">{scanState.reference}</span>
              {scanState.table && <span>Table {scanState.table}</span>}
              {scanState.zone && (
                <span className="capitalize">{scanState.zone}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-lagoon">
              {scanState.seated
                ? "Déjà installé(e)."
                : "Réservation trouvée."}
            </p>
          </div>

          {checkinState?.error && (
            <p className="text-center text-sm text-coral">
              {checkinState.error}
            </p>
          )}

          <div className="flex gap-2">
            {!scanState.seated && (
              <button
                onClick={() => handleCheckin(scanState.reference)}
                className="flex-1 inline-flex h-14 items-center justify-center rounded-xl bg-brass font-medium text-deep transition-colors hover:bg-brass/90"
              >
                Installer
              </button>
            )}
            <button
              onClick={() => {
                setScanState({ status: "idle" });
                setCheckinState(null);
              }}
              className="inline-flex h-14 items-center justify-center rounded-xl border border-shell/25 px-6 text-sm text-shell hover:border-brass hover:text-brass"
            >
              Nouveau scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
