# Portafolio Operativo: CARCAR (Cliente Fundador)

> **Archivo Original Excel**: [`CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx`](file:///c:/Users/xenon/Desktop/CARCAR/docs/clientes/carcar/CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx)  
> **Archivo de Datos Estructurado**: [`carcar-inventory.json`](file:///c:/Users/xenon/Desktop/CARCAR/docs/clientes/carcar/carcar-inventory.json)  
> **Script de Importación a Base de Datos**: [`scripts/import-carcar-portfolio.ts`](file:///c:/Users/xenon/Desktop/CARCAR/scripts/import-carcar-portfolio.ts)  

---

## 1. Resumen General del Portafolio

| Métrica | Valor | Moneda | Notas |
|---|:---:|:---:|---|
| **Total de Unidades Administradas** | **121** | — | Repartidas en 10 conjuntos/edificios |
| **Unidades de Renta Tradicional (Largo Plazo)** | **104** | `MXN` | Contratos mensuales recurrentes |
| **Unidades Vacacionales / Corta Estancia** | **17** | `USD` | Tarifas por noche, semana y mes |
| **Volumen Mensual de Renta Tradicional** | **~$1,001,782.80 MXN** | `MXN` | Sumatoria base de rentas mensuales |
| **Organización Destino en Base de Datos** | `CARCAR` | — | `brandName = "CARCAR"`, color corporativo `#0F766E` |

---

## 2. Desglose de Unidades de Largo Plazo (MXN)

El inventario tradicional consta de **104 unidades** distribuidas en 7 complejos operativos:

| Edificio / Conjunto | Número de Unidades | Tipología Principal | Rango de Rentas Mensuales (MXN) |
|---|:---:|---|:---:|
| **CHICHEN 124** | 19 | Departamentos / Estudios | $5,500 – $9,500 |
| **CHICHEN 126** | 22 | Departamentos / Estudios | $5,200 – $8,500 |
| **COLORINES** | 12 | Departamentos / Estudios | $6,000 – $9,000 |
| **BODEGAS** | 23 | Locales Comerciales / Bodegas | $3,500 – $18,000 |
| **COMODINOS** | 6 | Habitaciones / Estudios | $4,500 – $7,000 |
| **CASAS Y OTROS** | 2 | Casas Residenciales | $12,000 – $25,000 |
| **PESCADORES Y COLONIA** | 20 | Departamentos | $6,000 – $11,000 |
| **Subtotal Renta Tradicional** | **104 unidades** | — | **$1,001,782.80 MXN / mes** |

---

## 3. Desglose de Unidades Vacacionales (USD)

El inventario vacacional consta de **17 unidades** enfocadas en turismo y estancias cortas, cotizadas y cobradas en dólares estadounidenses (`USD`):

| Edificio / Complejo | Número de Unidades | Esquema Tarifario | Ubicación / Perfil |
|---|:---:|---|---|
| **MOONLIGHT CONDOS** | 15 | Tarifa por noche (`nightlyPrice`), semanal y mensual | Condominio turístico de alta gama |
| **PLAYA SOL** | 1 | Tarifa por noche / semanal | Zona turística frente a playa |
| **MAYAKOBA** | 1 | Tarifa por noche / mensual | Complejo residencial de lujo |
| **Subtotal Vacacional** | **17 unidades** | — | Moneda base: **USD** |

---

## 4. Ejecución del Script de Carga

Para sincronizar o resetear el inventario de CARCAR en la base de datos PostgreSQL, se utiliza el script automatizado:

```bash
# 1. Simulación previa (dry run - no modifica la base de datos)
npx tsx scripts/import-carcar-portfolio.ts --dry-run

# 2. Carga real e inserción en base de datos
npx tsx scripts/import-carcar-portfolio.ts
```

### Reglas de Mapeo Automático
- Las unidades en edificios con nombre `BODEGAS` o códigos `LOCAL` / `LOC` se catalogan automáticamente con `type = "COMMERCIAL"`.
- Los códigos con `EST`, `LOFT` o `STUDIO` se tipifican como `STUDIO`.
- Las habitaciones se tipifican como `ROOM`.
- El resto de unidades se clasifica como `APARTMENT`.
- Cada edificio y unidad queda estrictamente ligado a la `organizationId` de CARCAR.
