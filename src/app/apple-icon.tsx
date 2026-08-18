import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const rows =
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 32 32' fill='none'>" +
  "<rect x='6' y='8' width='20' height='4.6' rx='2.3' fill='#F59E0B'/>" +
  "<rect x='6' y='14.5' width='14' height='4.6' rx='2.3' fill='white'/>" +
  "<rect x='6' y='21' width='14' height='4.6' rx='2.3' fill='white'/></svg>";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563EB",
        }}
      >
        <img
          width={120}
          height={120}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(rows)}`}
        />
      </div>
    ),
    size,
  );
}
