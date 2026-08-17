"use client";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
