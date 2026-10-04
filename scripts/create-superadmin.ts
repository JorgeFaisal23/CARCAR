import "../prisma/env";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Crea una cuenta de superadministrador. Es la forma de dar de alta al primero
 * en producción, donde el seed (datos de demostración) nunca se corre.
 *
 *   npx tsx scripts/create-superadmin.ts correo@ejemplo.com "Nombre Apellido"
 *
 * Imprime una contraseña temporal una sola vez. Usa DIRECT_URL (o
 * DATABASE_URL) del entorno: revisa a qué base apunta antes de correrlo.
 */

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function tempPassword() {
  const chars = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map((g) => g.join("")).join("-");
}

async function main() {
  const [emailArg, ...nameParts] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const name = nameParts.join(" ").trim() || "Administración de la plataforma";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Uso: npx tsx scripts/create-superadmin.ts correo@ejemplo.com "Nombre"');
    process.exit(1);
  }

  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DIRECT_URL o DATABASE_URL.");
  const host = new URL(url).host;

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing) {
      console.error(`Ya existe una cuenta con ${email} (rol ${existing.role}). No se modificó nada.`);
      process.exit(1);
    }

    const password = tempPassword();
    await prisma.user.create({
      data: {
        email,
        name,
        role: "SUPERADMIN",
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    console.log(`Superadministrador creado en ${host}`);
    console.log(`  Correo:     ${email}`);
    console.log(`  Contraseña: ${password}   (temporal; no se volverá a mostrar)`);
    console.log("Entra por /login.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
