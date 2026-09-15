import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { UnitType, UnitStatus, Currency } from "../src/generated/prisma/enums";

/**
 * Script de importación para el portafolio real del cliente fundador: CARCAR.
 * Fuente: CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx (procesado en carcar-inventory.json)
 *
 * Ejecución:
 *   npx tsx scripts/import-carcar-portfolio.ts --dry-run   (simulación)
 *   npx tsx scripts/import-carcar-portfolio.ts             (impacta la base de datos)
 */

interface RawUnit {
  building: string;
  code: string;
  monthlyRent: number;
  currency: string;
  type: string;
  nightlyPrice?: number;
  weeklyPrice?: number;
}

interface InventoryFile {
  organization: {
    name: string;
    brandName: string;
    primaryColor: string;
    fontFamily: string;
  };
  summary: {
    totalUnits: number;
    vacationCount: number;
    longTermCount: number;
  };
  longTermUnits: RawUnit[];
  vacationUnits: RawUnit[];
}

const isDryRun = process.argv.includes("--dry-run");

function inferUnitType(buildingName: string, code: string): UnitType {
  const upperBuilding = buildingName.toUpperCase();
  const upperCode = code.toUpperCase();

  if (upperBuilding.includes("BODEGA") || upperCode.includes("LOCAL") || upperCode.includes("LOC")) {
    return "COMMERCIAL";
  }
  if (upperCode.includes("EST") || upperCode.includes("LOFT") || upperCode.includes("STUDIO")) {
    return "STUDIO";
  }
  if (upperCode.includes("ROOM") || upperCode.includes("CUARTO") || upperCode.includes("HAB")) {
    return "ROOM";
  }
  return "APARTMENT";
}

async function main() {
  console.log("=========================================================");
  console.log("  IMPORTADOR DE PORTAFOLIO: CLIENTE FUNDADOR (CARCAR)   ");
  console.log("=========================================================");
  if (isDryRun) {
    console.log("MODO SIMULACIÓN (--dry-run activo): No se alterará la base de datos.\n");
  }

  const jsonPath = path.resolve(__dirname, "carcar-inventory.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`No se encontró el archivo de inventario: ${jsonPath}`);
  }

  let fileContent = fs.readFileSync(jsonPath, "utf-8");
  if (fileContent.charCodeAt(0) === 0xfeff) {
    fileContent = fileContent.slice(1);
  }
  const rawData: InventoryFile = JSON.parse(fileContent);
  const { organization: orgData, longTermUnits, vacationUnits, summary } = rawData;

  console.log(`Organización destino : ${orgData.brandName}`);
  console.log(`Unidades largo plazo : ${summary.longTermCount} (MXN)`);
  console.log(`Unidades vacacionales: ${summary.vacationCount} (USD)`);
  console.log(`Total a procesar     : ${summary.totalUnits} unidades\n`);

  // Agrupar edificios
  const buildingMap = new Map<string, { type: "MIXED" | "LONG_TERM" | "VACATION"; units: RawUnit[] }>();

  for (const u of longTermUnits) {
    if (!buildingMap.has(u.building)) {
      buildingMap.set(u.building, { type: "LONG_TERM", units: [] });
    }
    buildingMap.get(u.building)!.units.push(u);
  }

  for (const u of vacationUnits) {
    if (!buildingMap.has(u.building)) {
      buildingMap.set(u.building, { type: "VACATION", units: [] });
    }
    buildingMap.get(u.building)!.units.push(u);
  }

  console.log("Edificios y propiedades identificadas:");
  for (const [name, b] of buildingMap.entries()) {
    console.log(` - ${name} (${b.units.length} unidades) [${b.type}]`);
  }
  console.log("");

  if (isDryRun) {
    console.log("Validación de muestra de unidades:");
    const sampleLT = longTermUnits.slice(0, 3);
    for (const u of sampleLT) {
      console.log(`  [LT] ${u.building} -> ${u.code} | $${u.monthlyRent} ${u.currency} | Tipo: ${inferUnitType(u.building, u.code)}`);
    }
    const sampleVac = vacationUnits.slice(0, 3);
    for (const u of sampleVac) {
      console.log(`  [VAC] ${u.building} -> ${u.code} | Noche: $${u.nightlyPrice} | Sem: $${u.weeklyPrice} | Mes: $${u.monthlyRent} ${u.currency}`);
    }
    console.log("\nSimulación finalizada con éxito. Ejecuta sin --dry-run para importar a la base de datos.");
    return;
  }

  // Conexión real a la BD
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("ADVERTENCIA: No se encontró DIRECT_URL o DATABASE_URL en el entorno.");
    console.warn("Asegúrate de configurar las variables de conexión a PostgreSQL.");
    return;
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Obtener o crear la organización CARCAR
    let org = await prisma.organization.findFirst({
      where: { brandName: orgData.brandName },
    });

    if (!org) {
      console.log(`Creando organización ${orgData.brandName}...`);
      org = await prisma.organization.create({
        data: {
          name: orgData.name,
          brandName: orgData.brandName,
          plan: "PREMIUM",
          primaryColor: orgData.primaryColor,
          fontFamily: orgData.fontFamily,
        },
      });
    } else {
      console.log(`Organización existente encontrada: ${org.brandName} (ID: ${org.id})`);
    }

    // 2. Crear o actualizar cuenta OWNER para CARCAR
    const ownerEmail = process.env.CARCAR_OWNER_EMAIL || "admin@carcar.mx";
    const ownerName = process.env.CARCAR_OWNER_NAME || "Administrador CARCAR";
    const ownerPassword = process.env.CARCAR_OWNER_PASSWORD || "carcar2026!";
    const passwordHash = bcrypt.hashSync(ownerPassword, 10);

    const ownerUser = await prisma.user.upsert({
      where: { email: ownerEmail },
      create: {
        email: ownerEmail,
        name: ownerName,
        role: "OWNER",
        organizationId: org.id,
        passwordHash,
      },
      update: {
        organizationId: org.id,
        role: "OWNER",
      },
    });
    console.log(`Usuario OWNER configurado: ${ownerUser.email} (ID: ${ownerUser.id})`);

    let totalCreatedBuildings = 0;
    let totalUpsertedUnits = 0;

    // 2. Procesar cada edificio y sus unidades
    for (const [buildingName, group] of buildingMap.entries()) {
      let building = await prisma.building.findFirst({
        where: {
          name: buildingName,
          organizationId: org.id,
        },
      });

      if (!building) {
        building = await prisma.building.create({
          data: {
            name: buildingName,
            organizationId: org.id,
            address: `Ubicación ${buildingName}, Quintana Roo`,
            city: "Playa del Carmen / Cancún",
          },
        });
        totalCreatedBuildings++;
      }

      for (const u of group.units) {
        const isVacation = u.type === "VACATION";
        const unitType = inferUnitType(u.building, u.code);
        const unitStatus: UnitStatus = isVacation ? "SHORT_TERM" : "AVAILABLE";
        const currency: Currency = (u.currency as Currency) || (isVacation ? "USD" : "MXN");

        await prisma.unit.upsert({
          where: {
            buildingId_code: {
              buildingId: building.id,
              code: u.code,
            },
          },
          create: {
            buildingId: building.id,
            code: u.code,
            name: `${building.name} - ${u.code}`,
            type: unitType,
            status: unitStatus,
            currency: currency,
            baseRent: u.monthlyRent,
            nightlyPrice: isVacation ? (u.nightlyPrice ?? null) : null,
            weeklyPrice: isVacation ? (u.weeklyPrice ?? null) : null,
          },
          update: {
            type: unitType,
            currency: currency,
            baseRent: u.monthlyRent,
            nightlyPrice: isVacation ? (u.nightlyPrice ?? null) : null,
            weeklyPrice: isVacation ? (u.weeklyPrice ?? null) : null,
          },
        });
        totalUpsertedUnits++;
      }
    }

    console.log("\n=========================================================");
    console.log("  IMPORTACIÓN COMPLETADA EXITOSAMENTE                   ");
    console.log("=========================================================");
    console.log(`Organización          : ${org.brandName}`);
    console.log(`Edificios registrados : ${buildingMap.size} (${totalCreatedBuildings} nuevos)`);
    console.log(`Unidades procesadas   : ${totalUpsertedUnits} unidades`);
    console.log("=========================================================\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Error durante la importación:", err);
  process.exit(1);
});
