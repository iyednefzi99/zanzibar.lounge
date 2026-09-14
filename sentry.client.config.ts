import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === "production",

  // Ajuster selon le trafic : 10% en prod, 100% en dev
  tracesSampleRate: 0.1,

  // Replays : capturer 100% des sessions en cas d'erreur
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Ne pas polluer les logs en dev
  debug: false,
});
