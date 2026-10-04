import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Lecturas del panel de plataforma. Cruzan arrendadoras a propósito, pero solo
 * traen lo necesario para administrarlas: conteos y su equipo. Los datos de
 * inquilinos, contratos y cobros no salen de aquí.
 */

export async function listOrganizations() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      brandName: true,
      logoUrl: true,
      plan: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          buildings: true,
          units: true,
          leases: { where: { status: "ACTIVE" } },
          users: { where: { role: { in: ["OWNER", "ADMIN", "VIEWER"] } } },
        },
      },
    },
  });

  return orgs.map(({ _count, ...org }) => ({
    ...org,
    buildings: _count.buildings,
    units: _count.units,
    activeLeases: _count.leases,
    staff: _count.users,
  }));
}

export async function getOrganizationDetail(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      brandName: true,
      logoUrl: true,
      plan: true,
      status: true,
      contactEmail: true,
      contactPhone: true,
      createdAt: true,
      users: {
        where: { role: { in: ["OWNER", "ADMIN", "VIEWER"] } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      },
      _count: {
        select: {
          buildings: true,
          units: true,
          leases: { where: { status: "ACTIVE" } },
          users: { where: { role: "TENANT" } },
        },
      },
    },
  });
  if (!org) return null;

  const { _count, users, ...rest } = org;
  return {
    ...rest,
    staff: users,
    buildings: _count.buildings,
    units: _count.units,
    activeLeases: _count.leases,
    tenants: _count.users,
  };
}

export type OrganizationDetail = NonNullable<Awaited<ReturnType<typeof getOrganizationDetail>>>;
