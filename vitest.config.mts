import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Pruebas unitarias y de integración.
 *
 * `server-only` lanza fuera de un React Server Component; en las pruebas se
 * sustituye por un módulo vacío para poder importar el código del servidor.
 * Los alias `@/` salen del tsconfig (Vite los resuelve de forma nativa).
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./src/test/empty-module.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
