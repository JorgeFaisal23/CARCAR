# Arquitectura: "North Star" y Principios de Desarrollo

> **Fuente de Verdad**: Este documento refleja los lineamientos rectores del proyecto definidos en [`AGENTS.md`](file:///c:/Users/xenon/Desktop/CARCAR/AGENTS.md).

---

## 1. La "North Star" (Estrella del Norte)

### A. Claridad Absoluta de Identidades
En este repositorio conviven dos entidades que **nunca deben confundirse**:

1. **El Producto (SaaS Multi-Tenant)**:
   - **Nombre temporal de trabajo**: `RentaCore` (placeholder hasta definición comercial).
   - **Qué es**: Plataforma SaaS en la nube para administración de propiedades inmobiliarias, control de arrendamientos tradicionales y vacacionales, cobro de servicios, prorrateos y portal para inquilinos.
   - **Dónde reside su identidad**: En el código fuente inmutable (`src/lib/app.ts`), con valores como `APP.name`, `APP.color`, metadatos y favicons.
2. **CARCAR (El Cliente Fundador)**:
   - **Qué es**: CARCAR **NO** es el software ni la marca del producto. CARCAR es nuestro **primer cliente real, socio comercial y piloto de validación operativa**.
   - **Portafolio**: 121 unidades (104 de largo plazo en MXN + 17 vacacionales en USD).
   - **Dónde reside su identidad**: En la base de datos dentro de la tabla `Organization` (`brandName = "CARCAR"`). Su logo y colores visten la interfaz de su propio tenant.

### B. El Principio Cardinal de Producto
> **CERO CÓDIGO A MEDIDA POR CLIENTE EN EL NÚCLEO DEL SAAS.**  
> Cualquier necesidad planteada por CARCAR (ej. cobrar en USD, gestionar tarifas por noche/semana o prorratear agua por m2) debe resolverse siempre como una **capacidad estándar, parametrizable y reutilizable** para cualquier arrendador en planes *Essential*, *Growth*, *Pro* o *Business*.

---

## 2. Aislamiento Multi-Tenant (Prioridad #1)

- **Filtro Obligatorio**: Toda entidad del sistema (`Building`, `Unit`, `Lease`, `Booking`, `ServiceAccount`, `ServiceCharge`, `Expense`, `AuditLog`) debe pertenecer a una `organizationId`.
- **Restricción de Acceso**: Ninguna consulta (`findMany`, `findFirst`) ni mutación (`create`, `update`, `delete`) puede omitir el filtro de la organización activa del usuario autenticado en sesión.

---

## 3. Separación de Capas en Next.js

```
+-------------------------------------------------------------------------------+
|                             CLIENTE / NAVEGADOR                              |
+-------------------------------------------------------------------------------+
           |                                                      ^
           | (Server Action Form / RPC)                           | (RSC HTML Stream)
           v                                                      |
+------------------------------------+        +---------------------------------+
|      src/server/actions/           |        |       src/lib/queries/          |
|  - Mutaciones y escrituras         |        |  - Lecturas exclusivas para     |
|  - 1. Verificar sesión y rol       |        |    React Server Components      |
|  - 2. Validar payload con Zod      |        |  - Filtradas por organizationId |
|  - 3. Mutación Prisma (tenant)     |        |  - Cero exposición de secrets   |
|  - 4. Registrar en AuditLog        |        +---------------------------------+
+------------------------------------+                         ^
           |                                                   |
           v                                                   |
+-------------------------------------------------------------------------------+
|                            PRISMA ORM & POSTGRESQL                            |
+-------------------------------------------------------------------------------+
```

1. **Lecturas (Queries)**:  
   Ubicadas en `src/lib/queries/` y consumidas exclusivamente por Server Components.
2. **Escrituras (Server Actions)**:  
   Ubicadas en `src/server/actions/`. Cada acción debe:
   - Validar autenticación de sesión y rol del usuario (`OWNER`, `ADMIN`, etc.).
   - Validar estrictamente los tipos de entrada mediante esquemas **Zod**.
   - Ejecutar la transacción en Prisma dentro del `organizationId` activo.
   - Insertar un registro en `AuditLog` para trazabilidad de auditoría.
3. **Control de Rutas (`src/proxy.ts`)**:  
   Verifica tokens firmados con `jose` y restringe el acceso a rutas según el rol del usuario.

---

## 4. Estándares de Calidad y Desarrollo

- **Tipado Estricto**: Cero uso de `any` en TypeScript.
- **Lógica Financiera Blindada**: Todo cálculo financiero (rentas, prorrateos por m2, recargos por mora, conversiones MXN/USD) debe respaldarse con pruebas automatizadas.
- **Almacenamiento de Archivos**: Prohibido almacenar imágenes o comprobantes como cadenas `base64` en PostgreSQL. Se utiliza almacenamiento compatible con S3 (Cloudflare R2) guardando únicamente la URL o clave del objeto.
- **Economía de Dependencias**: Mantener el bundle liviano utilizando las librerías preaprobadas (`shadcn/ui`, `Base UI`, `Tailwind v4`, `Lucide`, `date-fns`, `recharts`, `zod`).
