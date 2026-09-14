"use client";

import { useEffect, useRef } from "react";

type Metric = {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
};

declare global {
  interface Window {
    gtag?: (
      command: string,
      target: string,
      params: Record<string, unknown>,
    ) => void;
  }
}

function onRating(
  value: number,
  good: number,
  poor: number,
): "good" | "needs-improvement" | "poor" {
  if (value <= good) return "good";
  if (value > poor) return "poor";
  return "needs-improvement";
}

function sendToAnalytics(metric: Metric): void {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[web-vitals] ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`,
    );
  }
}

/**
 * Client-side performance monitor that tracks Core Web Vitals (LCP, FID/INP,
 * CLS) and resource loading metrics. Sends results to Vercel Analytics via
 * gtag when available, and logs to console in development.
 */
export function PerformanceMonitor() {
  const observedRef = useRef(false);

  useEffect(() => {
    if (observedRef.current) return;
    observedRef.current = true;

    // --- LCP (Largest Contentful Paint) ---
    const lcpEntries: PerformanceEntry[] = [];
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        lcpEntries.push(entry);
      }
    });
    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Not supported in all browsers.
    }

    // --- CLS (Cumulative Layout Shift) ---
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
    });
    try {
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // Not supported.
    }

    // --- FID/INP (First Input Delay / Interaction to Next Paint) ---
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const firstInput = entry as PerformanceEntry & {
          processingStart: number;
        };
        const fid = firstInput.processingStart - firstInput.startTime;
        sendToAnalytics({
          name: "FID",
          value: fid,
          rating: onRating(fid, 100, 300),
          id: (entry as { interactionId?: string }).interactionId,
        });
      }
    });
    try {
      fidObserver.observe({ type: "first-input", buffered: true });
    } catch {
      // Not supported.
    }

    // --- Resource timing ---
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        if (resource.initiatorType === "script" || resource.initiatorType === "link") {
          const duration = resource.responseEnd - resource.startTime;
          if (process.env.NODE_ENV === "development" && duration > 500) {
            console.log(
              `[resource] ${resource.initiatorType} ${resource.name.split("/").pop()}: ${duration.toFixed(0)}ms`,
            );
          }
        }
      }
    });
    try {
      resourceObserver.observe({ type: "resource", buffered: false });
    } catch {
      // Not supported.
    }

    // --- Report on pagehide ---
    const reportMetrics = () => {
      // LCP
      if (lcpEntries.length > 0) {
        const lastEntry = lcpEntries[lcpEntries.length - 1];
        sendToAnalytics({
          name: "LCP",
          value: lastEntry.startTime,
          rating: onRating(lastEntry.startTime, 2500, 4000),
          id: lastEntry.name,
        });
      }

      // CLS
      sendToAnalytics({
        name: "CLS",
        value: clsValue,
        rating: onRating(clsValue, 0.1, 0.25),
      });
    };

    window.addEventListener("pagehide", reportMetrics, { once: true });

    return () => {
      lcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
      resourceObserver.disconnect();
      window.removeEventListener("pagehide", reportMetrics);
    };
  }, []);

  return null;
}
