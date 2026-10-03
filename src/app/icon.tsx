import { ImageResponse } from "next/og";
import { APP, APP_INITIAL } from "@/lib/app";

/**
 * Favicon del producto. Se genera en código para que siga a APP.name y
 * APP.color (configurables por entorno) en vez de depender de un archivo fijo.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: APP.color,
          borderRadius: 8,
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {APP_INITIAL}
      </div>
    ),
    { ...size },
  );
}
