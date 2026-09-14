import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "E-Coffee Node",
    short_name: "E-Coffee",
    description: "Restaurant reservation & ordering platform",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#d4a843",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Admin Dashboard",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Guest App",
      },
    ],
    categories: ["food", "lifestyle", "business"],
    shortcuts: [
      {
        name: "Réserver",
        url: "/reserve",
        icons: [{ src: "/icons/reserve.png", sizes: "96x96" }],
      },
      {
        name: "Commander",
        url: "/order",
        icons: [{ src: "/icons/order.png", sizes: "96x96" }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
