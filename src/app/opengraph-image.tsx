import { ImageResponse } from "next/og";

export const alt = "BookBurr — Koordinasi bukber anti ribet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundColor: "#FFFFFF",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "480px",
            height: "480px",
            backgroundColor: "#F14641",
            borderRadius: "50%",
            opacity: 0.12,
            transform: "translate(160px, -160px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "300px",
            height: "300px",
            backgroundColor: "#1B5E3C",
            borderRadius: "50%",
            opacity: 0.08,
            transform: "translate(-100px, 100px)",
            display: "flex",
          }}
        />

        {/* Logo / emoji */}
        <div style={{ fontSize: "96px", marginBottom: "24px", display: "flex" }}>🔥</div>

        {/* Title */}
        <div
          style={{
            fontSize: "80px",
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.1,
            marginBottom: "16px",
            display: "flex",
          }}
        >
          BookBurr
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "36px",
            color: "#F14641",
            fontWeight: 600,
            display: "flex",
          }}
        >
          Koordinasi bukber anti ribet 🍛
        </div>
      </div>
    ),
    size,
  );
}
