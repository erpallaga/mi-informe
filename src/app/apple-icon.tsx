import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="94" fill="none" stroke="#000000" stroke-width="6"/><circle cx="100" cy="100" r="82" fill="none" stroke="#c6c6c6" stroke-width="3"/><polygon points="55,44 145,44 100,100" fill="none" stroke="#000000" stroke-width="5" stroke-linejoin="miter"/><polygon points="55,156 145,156 100,100" fill="#c6c6c6" stroke="#000000" stroke-width="5" stroke-linejoin="miter"/><polygon points="88,92 112,92 100,100" fill="#c6c6c6"/><line x1="55" y1="44" x2="145" y2="44" stroke="#000000" stroke-width="5"/><line x1="55" y1="156" x2="145" y2="156" stroke="#000000" stroke-width="5"/></svg>`;
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#f9f9fb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={140} height={140} alt="" />
      </div>
    ),
    { ...size }
  );
}
