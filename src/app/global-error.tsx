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
          backgroundColor: "#FFFFFF",
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
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
          Terjadi Kesalahan
        </h1>
        <p style={{ fontSize: "14px", color: "#666", margin: 0, textAlign: "center" }}>
          Terjadi kesalahan pada aplikasi. Silakan coba lagi.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#F14641",
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
          <a
            href="/home"
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#1a1a1a",
              textDecoration: "none",
            }}
          >
            Kembali ke Beranda
          </a>
        </div>
      </body>
    </html>
  );
}
