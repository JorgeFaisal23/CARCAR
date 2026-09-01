import type { MetadataRoute } from "next";
import { APP } from "@/lib/app";

/**
 * El manifiesto describe el producto, no al arrendador: es lo que el sistema
 * operativo guarda si alguien instala la app, y ahí debe leerse CARCAR.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP.name} · ${APP.tagline}`,
    short_name: APP.name,
    description: APP.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: APP.color,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
