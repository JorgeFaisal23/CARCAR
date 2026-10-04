import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido en .next/standalone (server.js + solo los módulos que
  // usa): es lo que copia la imagen de Docker. Ver Dockerfile.
  output: "standalone",
};

export default nextConfig;
