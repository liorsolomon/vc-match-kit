import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Niche Market Validation Reports — Validate Your Niche in 48 Hours";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            background: "#eef2ff",
            border: "2px solid #818cf8",
            borderRadius: "12px",
            padding: "8px 20px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#3730a3",
            marginBottom: "32px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          3vo Niche Reports · Starting at $49
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#111827",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          Validate Your Niche in 48 Hours{" "}
          <span style={{ color: "#4f46e5" }}>— Not 48 Days</span>
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#6b7280",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Competitors · Demand signals · Pricing benchmarks · ICP profile
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "20px",
            color: "#9ca3af",
          }}
        >
          validate.3vo.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
