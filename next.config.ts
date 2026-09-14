import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * La politique de sécurité du contenu (CSP) n'est **pas** ici : elle porte un
 * nonce recalculé à chaque requête et se pose donc dans `src/proxy.ts`. Deux
 * en-têtes CSP se cumuleraient de la façon la plus restrictive et casseraient
 * la page — il ne doit y en avoir qu'un.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
  disableLogger: false,
  automaticVercelMonitors: true,
});
