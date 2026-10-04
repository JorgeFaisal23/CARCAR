import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, type SessionPayload } from "@/lib/auth/jwt";
import { createOrgFixture, deleteOrgFixtures, type OrgFixture } from "@/test/fixtures";

/**
 * Acciones de plataforma con la sesión real (JWT firmado + validación en la
 * base). Solo cambia de dónde salen las cookies: aquí no hay petición HTTP.
 */

const jar = vi.hoisted(() => ({ token: "" }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "rentas_session" && jar.token ? { value: jar.token } : undefined),
    set: () => {},
    delete: () => {},
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const {
  createOrganization,
  setOrganizationPlan,
  setOrganizationStatus,
  resetOwnerPassword,
  updateOrganization,
} = await import("@/server/superadmin/actions");

let fixture: OrgFixture;
let superId: string;
const createdOrgIds: string[] = [];

async function actAs(user: { id: string; email: string; role: SessionPayload["role"]; organizationId: string | null; slug: string | null }) {
  const sessionId = randomUUID();
  await prisma.user.update({ where: { id: user.id }, data: { currentSessionId: sessionId } });
  jar.token = await signSession({
    sub: user.id,
    email: user.email,
    name: "Prueba",
    role: user.role,
    sessionId,
    orgId: user.organizationId,
    orgSlug: user.slug,
  });
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeAll(async () => {
  fixture = await createOrgFixture("plataforma");
  const superadmin = await prisma.user.create({
    data: {
      email: `super-${randomUUID().slice(0, 8)}@test.mx`,
      name: "Super",
      role: "SUPERADMIN",
      passwordHash: "x",
    },
  });
  superId = superadmin.id;
});

afterAll(async () => {
  const created = await prisma.organization.findMany({
    where: { id: { in: createdOrgIds } },
    select: { id: true },
  });
  await deleteOrgFixtures(
    fixture,
    ...created.map((org) => ({ organizationId: org.id }) as OrgFixture),
  );
  await prisma.user.delete({ where: { id: superId } });
});

describe("acciones de plataforma", () => {
  it("rechazan a un dueño de arrendadora", async () => {
    await actAs({
      id: fixture.owner.id,
      email: fixture.owner.email,
      role: "OWNER",
      organizationId: fixture.organizationId,
      slug: fixture.org.slug,
    });
    await expect(setOrganizationPlan(fixture.organizationId, "PREMIUM")).rejects.toThrow(/permiso/);
    await expect(setOrganizationStatus(fixture.organizationId, "SUSPENDED")).rejects.toThrow(/permiso/);
    await expect(resetOwnerPassword(fixture.owner.id)).rejects.toThrow(/permiso/);

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: fixture.organizationId } });
    expect(org.plan).toBe("FREE");
    expect(org.status).toBe("ACTIVE");
  });

  it("el superadministrador crea una arrendadora con su dueño", async () => {
    await actAs({ id: superId, email: "super@test.mx", role: "SUPERADMIN", organizationId: null, slug: null });
    const slug = `nueva-${randomUUID().slice(0, 6)}`;
    const email = `dueno-${slug}@test.mx`;

    const result = await createOrganization(
      {},
      form({ name: "Nueva Arrendadora", slug, plan: "PREMIUM", ownerName: "Dueña Nueva", ownerEmail: email }),
    );
    expect(result.ok).toBe(true);
    createdOrgIds.push(result.orgId!);

    const owner = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(owner.role).toBe("OWNER");
    expect(owner.organizationId).toBe(result.orgId);
    // Sin SMTP en pruebas: el acceso llega como contraseña temporal.
    expect(result.delivery?.method).toBe("password");
    const temp = result.delivery?.method === "password" ? result.delivery.tempPassword : "";
    expect(await bcrypt.compare(temp, owner.passwordHash)).toBe(true);
    expect(owner.mustChangePassword).toBe(true);

    // Slug y correo ya usados.
    expect(
      await createOrganization({}, form({ name: "Otra", slug, plan: "FREE", ownerName: "Otra Persona", ownerEmail: `x-${email}` })),
    ).toHaveProperty("error");
    expect(
      await createOrganization({}, form({ name: "Otra", slug: `${slug}-b`, plan: "FREE", ownerName: "Otra Persona", ownerEmail: email })),
    ).toHaveProperty("error");
    expect(
      await createOrganization({}, form({ name: "Otra", slug: "superadmin", plan: "FREE", ownerName: "Otra Persona", ownerEmail: `y-${email}` })),
    ).toHaveProperty("error");
  });

  it("cambia el plan y el slug", async () => {
    await actAs({ id: superId, email: "super@test.mx", role: "SUPERADMIN", organizationId: null, slug: null });
    expect(await setOrganizationPlan(fixture.organizationId, "PREMIUM")).toEqual({ ok: true });

    const newSlug = `renombrada-${randomUUID().slice(0, 6)}`;
    expect(
      await updateOrganization({}, form({ orgId: fixture.organizationId, name: "Renombrada", slug: newSlug })),
    ).toEqual({ ok: true });

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: fixture.organizationId } });
    expect(org.plan).toBe("PREMIUM");
    expect(org.slug).toBe(newSlug);
  });

  it("suspender cierra las sesiones de la arrendadora", async () => {
    await prisma.user.update({ where: { id: fixture.tenant.id }, data: { currentSessionId: "viva" } });
    await actAs({ id: superId, email: "super@test.mx", role: "SUPERADMIN", organizationId: null, slug: null });

    expect(await setOrganizationStatus(fixture.organizationId, "SUSPENDED")).toEqual({ ok: true });
    const tenant = await prisma.user.findUniqueOrThrow({ where: { id: fixture.tenant.id } });
    expect(tenant.currentSessionId).toBeNull();

    expect(await setOrganizationStatus(fixture.organizationId, "ACTIVE")).toEqual({ ok: true });
  });

  it("solo restablece contraseñas de dueños", async () => {
    await actAs({ id: superId, email: "super@test.mx", role: "SUPERADMIN", organizationId: null, slug: null });
    expect(await resetOwnerPassword(fixture.tenant.id)).toHaveProperty("error");

    const result = await resetOwnerPassword(fixture.owner.id);
    expect(result.ok).toBe(true);
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: fixture.owner.id } });
    const temp = result.delivery?.method === "password" ? result.delivery.tempPassword : "";
    expect(await bcrypt.compare(temp, owner.passwordHash)).toBe(true);
    expect(owner.mustChangePassword).toBe(true);
    expect(owner.currentSessionId).toBeNull();
  });
});

// La cookie de sesión se llama así en jwt.ts; si cambia, el mock de arriba
// debe cambiar con ella.
it("el mock de cookies usa el nombre real de la cookie", () => {
  expect(SESSION_COOKIE).toBe("rentas_session");
});
