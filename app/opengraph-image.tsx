import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VC Match Kit — Stop Cold-Pitching the Wrong VCs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1E293B",
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
            background: "rgba(79,70,229,0.2)",
            border: "2px solid #4F46E5",
            borderRadius: "12px",
            padding: "8px 20px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#818CF8",
            marginBottom: "32px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Curated · Delivered in 48 hrs · $147 one-time
        </div>
        <div
          style={{
            fontSize: "60px",
            fontWeight: 800,
            color: "#F8FAFC",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          Stop pitching cold.{" "}
          <span style={{ color: "#818CF8" }}>Get in front of investors who are actually writing checks.</span>
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Curated VC and angel investor list — filtered by stage, check size, sector, and recent deals.
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "20px",
            color: "#64748B",
          }}
        >
          vc.3vo.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
