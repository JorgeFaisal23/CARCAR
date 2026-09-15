import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Neon cierra conexiones ociosas; el adaptador de pg mantiene el pool.
// En desarrollo guardamos el cliente en globalThis para que el hot reload no
// abra un pool nuevo en cada recarga.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "La variable de entorno DATABASE_URL no está configurada. Por favor, crea un archivo .env en la raíz del proyecto con la cadena de conexión de PostgreSQL.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
