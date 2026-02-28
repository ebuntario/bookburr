"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "sans-serif",
          backgroundColor: "#FFF8F0",
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          margin: 0,
        }}
      >
        <p style={{ fontSize: "48px", margin: 0 }}>😵</p>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
          Waduh, ada yang error nih
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0, textAlign: "center" }}>
          Aplikasinya error parah. Coba refresh dulu ya bestie.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#D4A843",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Coba Lagi
        </button>
      </body>
    </html>
  );
}
