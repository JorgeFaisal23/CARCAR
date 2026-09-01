import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 lee las URLs de conexión desde aquí (ya no desde schema.prisma).
 * Para DDL usamos la conexión directa de Neon (sin pooler): pgbouncer no
 * soporta los comandos que Prisma necesita para crear o alterar tablas.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
