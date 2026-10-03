import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { ModelName } from "@/generated/prisma/internal/prismaNamespace";
import { PLATFORM_MODELS, TENANT_MODELS } from "@/lib/db/scope";

/**
 * Reglas de arquitectura que sostienen el aislamiento entre arrendadoras.
 * No prueban comportamiento: fallan cuando alguien rompe la convención.
 */

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === "generated" ? [] : walk(full);
    }
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const rel = (file: string) => relative(ROOT, file).split(sep).join("/");

/** Mismos módulos de plataforma que la regla de ESLint (eslint.config.mjs). */
const PLATFORM_PREFIXES = [
  "src/lib/prisma.ts",
  "src/lib/db/",
  "src/lib/auth/",
  "src/lib/org.ts",
  "src/app/login/",
  "src/server/auth/",
  "src/server/superadmin/",
  "src/test/",
];

describe("aislamiento entre arrendadoras", () => {
  it("cada modelo está clasificado", () => {
    const classified = new Set<string>([
      "Organization",
      ...TENANT_MODELS,
      ...PLATFORM_MODELS,
    ]);
    expect([...classified].sort()).toEqual(Object.values(ModelName).sort());
  });

  it("solo los módulos de plataforma importan el cliente sin alcance", () => {
    const offenders = walk(SRC)
      .map(rel)
      .filter((file) => !PLATFORM_PREFIXES.some((prefix) => file.startsWith(prefix)))
      .filter((file) =>
        /from\s+["'](@\/lib\/prisma|.*\/lib\/prisma)["']/.test(
          readFileSync(join(ROOT, file), "utf8"),
        ),
      );
    expect(offenders).toEqual([]);
  });

  it("toda server action exportada exige sesión antes de hacer nada", () => {
    const actionsDir = join(SRC, "server", "actions");
    const missing: string[] = [];

    for (const name of readdirSync(actionsDir)) {
      const source = readFileSync(join(actionsDir, name), "utf8");
      if (!source.startsWith('"use server"')) continue;

      const chunks = source.split(/^export async function /m).slice(1);
      for (const chunk of chunks) {
        const fn = chunk.slice(0, chunk.indexOf("("));
        if (!/await require\w*Action\(/.test(chunk)) missing.push(`${name}: ${fn}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
