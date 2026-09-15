# Stack Tecnológico y Estándares de Implementación

> **Repositorio**: CARCAR / RentaCore SaaS  
> **Arquitectura**: Next.js App Router (Full-Stack TypeScript)  

---

## 1. Visión General del Stack

| Capa | Tecnología / Herramienta | Versión | Propósito / Función |
|---|---|:---:|---|
| **Framework Full-Stack** | **Next.js** (App Router) | `16.x` | Renderizado híbrido (RSC), Server Actions y rutas de API |
| **Biblioteca de UI** | **React** | `19.x` | Componentes declarativos, `Suspense` y Server Actions nativos |
| **Estilos y Diseño** | **Tailwind CSS** | `v4` | Sistema de tokens CSS variables, diseño responsive y dark mode |
| **Componentes Base** | **shadcn / Base UI** | — | Componentes accesibles, diálogos, selectores y formularios |
| **Iconografía** | **Lucide React** | Latest | Iconos vectoriales uniformes |
| **ORM / Acceso a Datos** | **Prisma** (`@prisma/client`) | `7.x` | Tipado estricto de base de datos, migraciones y queries seguras |
| **Base de Datos** | **PostgreSQL** (Neon / VPS) | `16 / 17` | Almacenamiento relacional transaccional ACID |
| **Autenticación** | **Jose** (JWT firmado) | Latest | Sesiones stateless seguras en cookies `HttpOnly` |
| **Validación de Datos** | **Zod** | Latest | Validación estricta de esquemas en cliente y servidor |
| **Manipulación de Fechas** | **date-fns** | Latest | Cálculos de vencimientos, periodos y prorrateos de días |
| **Gráficas y Analítica** | **Recharts** | Latest | Gráficas de ingresos, cobranza y ocupación en dashboard |

---

## 2. Decisiones de Arquitectura

### A. React Server Components (RSC) Primero
- Toda la obtención de datos para la visualización inicial de pantallas se realiza en el servidor en Server Components (`src/app/(dashboard)/.../page.tsx`).
- Se reduce drásticamente el tamaño del JavaScript enviado al navegador del cliente.
- Las consultas a la base de datos se ejecutan en proximidad directa sin exponer endpoints REST públicos innecesarios.

### B. Mutaciones con Server Actions
- Las acciones de modificación (`src/server/actions/`) son funciones asíncronas de servidor invocadas desde formularios o eventos de UI.
- Cada acción realiza validación estricta de entrada con esquemas Zod antes de interactuar con Prisma, asegurando que ningún dato corrupto ingrese a la base de datos.

### C. Autenticación y Enrutamiento con Proxy (`src/proxy.ts`)
- Las sesiones de usuario se encapsulan en tokens JWT firmados criptográficamente mediante la librería `jose`.
- La verificación de roles se ejecuta a nivel de middleware/proxy, impidiendo que usuarios no autorizados o inquilinos accedan a rutas administrativas como `/propiedades`, `/cobros` o `/configuracion`.

---

## 3. Scripts Principales del Proyecto

```bash
# Desarrollo local
npm run dev               # Inicia el servidor de desarrollo en http://localhost:3000

# Base de datos (Prisma)
npm run db:push           # Sincroniza el schema.prisma con la base de datos sin generar migraciones pesadas
npm run db:seed           # Puebla la base de datos con cuentas de prueba y datos demo
npm run db:studio         # Interfaz web gráfica para inspeccionar las tablas de PostgreSQL

# Calidad y compilación
npm run build             # Compilación optimizada para producción (Next.js standalone)
npx tsc --noEmit          # Verificación de tipos TypeScript estricta
```
