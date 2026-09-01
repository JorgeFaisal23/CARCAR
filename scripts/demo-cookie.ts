import "dotenv/config";
import { SignJWT } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Herramienta de desarrollo: imprime una cookie de sesión válida para el correo
 * indicado, para poder revisar rutas protegidas con curl sin pasar por el
 * formulario de login.
 *
 *   npx tsx scripts/demo-cookie.ts admin@demo.mx
 */

const email = process.argv[2] ?? "admin@demo.mx";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  }),
});

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No existe el usuario ${email}`);

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

  console.log(`rentas_session=${token}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
