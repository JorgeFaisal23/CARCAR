<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# GUÍA DE ARQUITECTURA, "NORTH STAR" Y DESARROLLO CON IA

Este documento es la **fuente de verdad absoluta** para todos los desarrolladores y agentes de IA (Claude, Antigravity, Cursor, etc.) que trabajen en este repositorio.

---

## 1. LA "NORTH STAR" (ESTRELLA DEL NORTE)

### A. Claridad de Identidades (REGLA FUNDAMENTAL)
1. **El Producto (SaaS Multi-Tenant)**:
   - **Nombre temporal**: `RentaCore` (placeholder; nombre comercial por definir antes del lanzamiento público).
   - **Qué es**: Una plataforma SaaS multi-empresa para gestión de rentas tradicionales y vacacionales, cobro de servicios, prorrateos y portal para inquilinos.
   - **Dónde vive su identidad fija**: `src/lib/app.ts` (`APP.name`, `APP.color`, etc.).
2. **CARCAR (El Cliente Beta / Fundador)**:
   - **Qué es**: CARCAR **NO** es el software. CARCAR es nuestro **primer cliente real, cliente fundador y piloto de validación**.
   - **Portafolio de CARCAR**: 121 unidades (104 de largo plazo en MXN + 17 vacacionales en USD).
   - **Dónde vive su identidad**: En la base de datos dentro de la tabla `Organization` (`brandName = "CARCAR"`). Viste la interfaz operativa con su propio logo y colores.

### B. El Principio Cardinal de Producto
> **CERO CÓDIGO A MEDIDA POR CLIENTE EN EL NÚCLEO DEL SAAS.**
> Toda necesidad planteada por CARCAR (por ejemplo, cobrar en USD o gestionar tarifas por noche/semana) debe resolverse como una **capacidad estándar, configurable y reutilizable** de la plataforma para cualquier futuro cliente bajo los planes *Essential*, *Growth*, *Pro* o *Business*.

---

## 2. BUENAS PRÁCTICAS DE DESARROLLO ASISTIDO POR IA

Para evitar acumulación de deuda técnica, inconsistencias o "AI slop", todo trabajo con agentes de IA debe regirse por los siguientes principios:

### A. Spec-Driven Development (Desarrollo Guiado por Especificaciones)
Nunca se escribe código de negocio complejo sin una fase previa de especificación:
1. **Contrato de Datos Primero**: Definir los esquemas Zod con validación estricta antes de codificar Server Actions o interfaces.
2. **Plan Técnico Aprobado**: Documentar archivos a modificar, consideraciones de seguridad y riesgos antes de ejecutar.
3. **Validación Automática**: El agente debe verificar compilación (`tsc --noEmit`), linter (`eslint`) y pruebas antes de dar una tarea por terminada.

### B. Protocolo MCP (Model Context Protocol)
El entorno de desarrollo está preparado para interactuar mediante MCP para evitar alucinaciones:
- **PostgreSQL / Prisma MCP**: Permite al agente inspeccionar esquemas reales, validar queries y verificar la estructura de datos local sin adivinar.
- **Git / GitHub MCP**: Para automatización trazable de ramas, commits convencionales y pull requests.
- **Documentación / Context MCP**: Consulta directa de documentación viva de Next.js 16, React 19 y Tailwind v4.

### C. Guardrails de Calidad y Cero "AI Slop"
- **Tipado Estricto**: Prohibido el uso de `any` en TypeScript.
- **Lógica Financiera Blindada**: Todo cálculo que involucre dinero (rentas, prorrateos de agua/luz por m2, recargos por mora, conversiones MXN/USD) debe contar con pruebas unitarias automatizadas. La IA no debe alterar estas fórmulas sin ejecutar los tests correspondientes.
- **Economía de Dependencias**: No instalar librerías redundantes. Ya contamos con `shadcn/ui`, `Base UI`, `Tailwind v4`, `Lucide`, `date-fns`, `recharts` y `zod`.

---

## 3. ESTÁNDARES DE ARQUITECTURA DE SOFTWARE

### A. Aislamiento Multi-Tenant (Prioridad #1)
- Cada entidad del sistema (`Building`, `User`, `Lease`, `Booking`, `ServiceAccount`, `AuditLog`) debe pertenecer a una `organizationId`.
- Ninguna lectura ni mutación puede omitir el filtro de la organización activa del usuario en sesión.

### B. Separación de Capas en Next.js
- **Lecturas**: Archivos en `src/lib/queries/` consumidos exclusivamente por Server Components.
- **Escrituras / Mutaciones**: Archivos en `src/server/actions/` expuestos como Server Actions. Cada acción **debe**:
  1. Verificar autenticación y rol del usuario.
  2. Validar payload con un esquema Zod.
  3. Ejecutar la mutación en Prisma dentro del tenant correspondiente.
  4. Registrar la acción en `AuditLog`.
- **Rutas y Permisos**: `src/proxy.ts` valida sesiones firmadas con `jose` y restringe rutas según el rol (`OWNER`, `ADMIN`, `VIEWER`, `TENANT`).

### C. Multidivisa y Rentas Mixtas
- Toda propiedad o unidad debe declarar explícitamente su moneda (`currency: "MXN" | "USD"`).
- Las unidades soportan tanto esquemas tradicionales de renta mensual (`baseRent`) como tarifas de corta estancia (`nightlyPrice`, `weeklyPrice`, `monthlyPrice`).

### D. Almacenamiento de Archivos (Producción)
- **Prohibido en producción**: Almacenar fotos de comprobantes de pago o logos como strings base64 dentro de PostgreSQL.
- **Estándar**: Subir objetos a almacenamiento S3 compatible (Cloudflare R2) y almacenar únicamente la URL / Key en la base de datos.

---

## 4. DESPLIEGUE EN VPS Y SEGURIDAD

- **Infraestructura**: Despliegue en contenedor Docker (`output: "standalone"` de Next.js) orquestado con Docker Compose.
- **Base de Datos**: PostgreSQL 16/17 con volumen persistente encriptado y dumps automáticos diarios cifrados hacia almacenamiento secundario.
- **Proxy Inverso & SSL**: Caddy o Traefik gestionando TLS 1.3 automáticamente.
- **Perímetro de Seguridad**: Cloudflare WAF + Proxy activo (ocultamiento de la IP pública del VPS, mitigación DDoS L7 y rate limiting en `/login`).
- **Hardening del Servidor**: Firewall UFW cerrado (solo 80, 443 y SSH protegido por llaves Ed25519; sin acceso root por contraseña), Fail2ban activo y parches automáticos de seguridad.

