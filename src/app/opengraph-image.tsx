import { ImageResponse } from "next/og";

import { site } from "@/content/site";

export const runtime = "edge";
export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0f1a",
          color: "#f5e6d3",
          fontFamily: "serif",
        }}
      >
        <h1 style={{ fontSize: 72, fontWeight: 700, margin: 0 }}>
          {site.name}
        </h1>
        <p style={{ fontSize: 28, marginTop: 16, opacity: 0.8 }}>
          {site.tagline}
        </p>
      </div>
    ),
    { ...size },
  );
}
