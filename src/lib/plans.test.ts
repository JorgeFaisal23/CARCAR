import { describe, expect, it } from "vitest";
import { limitError } from "@/lib/plans";

describe("limitError", () => {
  it("deja crear mientras no se pase del límite gratuito", () => {
    expect(limitError("FREE", "buildings", 0)).toBeNull();
    expect(limitError("FREE", "buildings", 1)).toBeNull();
    expect(limitError("FREE", "units", 19)).toBeNull();
    expect(limitError("FREE", "staff", 0)).toBeNull();
  });

  it("bloquea al alcanzar el límite gratuito", () => {
    expect(limitError("FREE", "buildings", 2)).toMatch(/hasta 2 propiedades/);
    expect(limitError("FREE", "units", 20)).toMatch(/hasta 20 unidades/);
    expect(limitError("FREE", "staff", 1)).toMatch(/1 usuario de equipo/);
  });

  it("Premium no tiene límite", () => {
    expect(limitError("PREMIUM", "buildings", 500)).toBeNull();
    expect(limitError("PREMIUM", "staff", 500)).toBeNull();
  });
});
