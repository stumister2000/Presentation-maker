import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/brand";

export const alt = `${APP_NAME}: presentations in a minute`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b6e64", color: "#ffffff", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 700 }}>
          <svg width="64" height="64" viewBox="0 0 24 24">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h8.8L20 7.7v10.8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5z" fill="#ffffff" />
            <path d="M8 12.5h8M8 16h5" stroke="#0b6e64" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {APP_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>Presentations in a minute.</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, color: "#bfe6df" }}>The price before you start.</div>
        </div>
        <div style={{ fontSize: 28, color: "#e4f3f0" }}>No sign-up · no credits · open and start</div>
      </div>
    ),
    size,
  );
}
