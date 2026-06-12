import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BatchFlow — custo sob controle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#182131",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Grade de fundo sutil */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(43,196,176,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(43,196,176,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Brilho central */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(43,196,176,0.12) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-2px",
            }}
          >
            Batch
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#2bc4b0",
              letterSpacing: "-2px",
            }}
          >
            Flow
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: "0.5px",
            marginBottom: 48,
          }}
        >
          Custo sob controle. Margem no ponto certo.
        </div>

        {/* Pill de destaque */}
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {["Precificação", "Estoque", "Margem"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(43,196,176,0.15)",
                border: "1px solid rgba(43,196,176,0.35)",
                borderRadius: 999,
                padding: "8px 24px",
                fontSize: 20,
                color: "#2bc4b0",
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
