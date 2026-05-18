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
          background: "#0f172a",
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
            display: "flex",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "999px",
            padding: "8px 20px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#a5b4fc",
            marginBottom: "32px",
          }}
        >
          VC Match Kit
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "60px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            marginBottom: "24px",
          }}
        >
          Stop Cold-Pitching the Wrong VCs
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          AI-powered VC matching for pre-seed founders. Find the right investors in minutes, not weeks.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "40px",
            fontSize: "20px",
            color: "#64748b",
          }}
        >
          vc.3vo.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
