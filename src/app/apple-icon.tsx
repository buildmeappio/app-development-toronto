import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const mark =
  "<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 32 32' fill='none'>" +
  "<g stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'>" +
  "<polyline points='12,11 8,16 12,21'/><polyline points='20,11 24,16 20,21'/>" +
  "<line x1='18' y1='9.5' x2='14' y2='22.5'/></g></svg>";

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
          background: "linear-gradient(135deg, #2563EB, #4F46E5)",
        }}
      >
        <img
          width={110}
          height={110}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(mark)}`}
        />
      </div>
    ),
    size,
  );
}
