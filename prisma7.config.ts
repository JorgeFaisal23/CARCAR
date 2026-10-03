import "./prisma/env";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 lee las URLs de conexión desde aquí (ya no desde schema.prisma).
 * Para DDL se usa la conexión directa (sin pooler): pgbouncer no soporta los
 * comandos que Prisma necesita para crear o alterar tablas.
 *
 * `migrate dev` necesita una base auxiliar vacía (shadow) para calcular
 * diferencias; solo se usa en desarrollo.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
