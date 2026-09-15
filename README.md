# RentaCore (CARCAR Beta Operativa)

**RentaCore** es la plataforma SaaS multi-empresa para administración de propiedades inmobiliarias, gestión de arrendamientos tradicionales y vacacionales, control y prorrateo de servicios, cobranza y portal de autoservicio para inquilinos.

## Claridad de Identidades (North Star)

No deben confundirse el producto y el cliente:

| Entidad | Qué es | Dónde reside | Quién la administra |
|---|---|---|---|
| **RentaCore** | El producto SaaS Multi-Tenant | Código fuente (`src/lib/app.ts`) | Equipo tecnológico (fija) |
| **CARCAR** | Cliente fundador / piloto de validación | Tabla `Organization` (`brandName = "CARCAR"`) | El cliente desde `/configuracion/marca` |

La marca del cliente arrendador (CARCAR o cualquier futuro tenant) viste toda la interfaz operativa (panel, portal y acceso con su propio logo y colores). El producto SaaS aparece únicamente en los márgenes técnicos (pie de página, metadatos y favicon por defecto).

## Cuentas de demostración

Contraseña para todas: **`demo1234`**. En la pantalla de acceso hay botones que
llenan el formulario con cada perfil.

| Correo | Rol | Qué puede hacer |
|---|---|---|
| `dueno@demo.mx` | Arrendador | Todo, incluida la marca y el plan |
| `admin@demo.mx` | Administrativo | Propiedades, servicios, cobros e inquilinos |
| `consulta@demo.mx` | Consulta | **Solo lectura**: resumen y calendario |
| `inquilino@demo.mx` | Inquilino | Portal con su contrato, pagos y servicios |

## Puesta en marcha

```bash
npm install
npm run db:push     # crea las tablas en la base de datos
npm run db:seed     # carga los datos de demostración
npm run dev         # http://localhost:3000
```

Variables de entorno (ver `.env.example`):

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión agrupada de Neon; la usa la app en ejecución |
| `DIRECT_URL` | Conexión directa (sin `-pooler`); Prisma la necesita para crear o alterar tablas |
| `AUTH_SECRET` | Clave con la que se firman las sesiones |

Otros comandos:

```bash
npm run db:reset    # borra todo y vuelve a sembrar
npm run db:studio   # explorador de la base de datos
npm run build       # build de producción
```

## Documentación del Sistema

Toda la documentación técnica, comercial, de clientes y guías de infraestructura se encuentra centralizada y organizada en la carpeta [`docs/`](docs/README.md):

- [💼 **Negocio y Modelo SaaS**](docs/negocio/modelo-saas-y-sociedad.md): Propuestas comerciales, tiers de suscripción y acuerdos de socios.
- [🏢 **Clientes y Portafolios**](docs/clientes/carcar/resumen-portafolio.md): Inventario de 121 unidades de CARCAR (104 MXN + 17 USD) y scripts de importación.
- [🏛️ **Arquitectura y "North Star"**](docs/arquitectura/north-star.md): Principios rectores del SaaS, modelo de datos relacional y stack tecnológico.
- [🚀 **Despliegue y Seguridad en VPS**](docs/despliegue/vps-deployment-guide.md): Docker Compose, Caddy TLS 1.3, Cloudflare WAF y hardening de servidores.

Consulta el [**Índice General de Documentación**](docs/README.md) para ver el mapa completo de archivos.

## Cómo está organizado

```
prisma/
  schema.prisma          modelo de datos
  seed.ts                datos de demostración
src/
  app/
    login/               acceso
    (dashboard)/         panel administrativo (menú lateral)
    (portal)/portal/     portal del inquilino (sin menú lateral)
  components/
    ui/                  componentes de shadcn/ui (Base UI)
    shared/              piezas propias reutilizables
    layout/              menú lateral, menú de usuario, avisos
    premium/             muro de pago
  lib/
    auth/                sesión con JWT firmado (jose)
    queries/             lecturas de base de datos, una por módulo
    services/            reparto de recibos de edificio
    brand.ts             identidad de marca → variables CSS
    labels.ts            textos en español y semáforo de estados
  server/actions/        Server Actions (escrituras)
  proxy.ts               control de acceso por rol
```

### Decisiones que conviene conocer

- **Comprobante de pago con la cámara.** Al registrar un pago se puede adjuntar
  una foto del recibo o de la transferencia. El botón "Tomar foto" usa
  `capture="environment"`, así que en celular abre la cámara directamente. El
  comprobante es **opcional**: obligarlo bloquearía los pagos en efectivo que se
  registran sin papel. Se ve desde Cobros, desde la ficha del inquilino y desde
  el portal del propio inquilino; si se deshace el pago, el comprobante se borra
  con él porque era la evidencia de ese pago.

- **Sesión propia en vez de NextAuth.** Un JWT firmado con `jose` (~60 líneas en
  `src/lib/auth/`) cubre login por credenciales y funciona igual en el runtime
  Edge del proxy y en las Server Actions, sin depender de una beta.
- **Marca como variables CSS.** `src/lib/brand.ts` convierte el color, el radio y
  la tipografía guardados en `Organization` en tokens que se inyectan en el
  layout raíz durante el render en servidor. Por eso el cambio de marca se
  aplica en el primer pintado, sin parpadeo, y alcanza al panel, al portal y a
  la pantalla de acceso. Ningún componente escribe un color a mano.
- **`<select>` nativo en los formularios.** En celular abre el selector del
  sistema; la demo se muestra en teléfono.
- **Prisma 7 con driver adapter.** Las URLs viven en `prisma7.config.ts`, no en
  el esquema. Se usa `db push` en vez de migraciones: es una demo y así el
  esquema y la base se mantienen sincronizados sin historial que administrar.
- **El color de los estados no es el color de marca.** Verde/ámbar/rojo y los
  colores del calendario están fuera de los tokens de marca a propósito:
  distinguir "vencido" de "pagado" es información, no estilo, y debe seguir
  siendo legible con cualquier color que elija el arrendador.

## Alcance de la demo

- **La pantalla de Integraciones está oculta del menú.** La sincronización con
  Airbnb es simulada, así que por ahora no se muestra en la demostración. El
  código y los datos siguen intactos: para volver a mostrarla, pon
  `SHOW_AIRBNB_INTEGRATION = true` en
  [`src/lib/features.ts`](src/lib/features.ts). Las reservas de corta estancia
  siguen visibles en el calendario y en la ficha de cada unidad.
- **Airbnb está simulado.** El botón "Sincronizar ahora" no consulta Airbnb: solo
  actualiza la marca de tiempo y refresca las reservas ya sembradas. El camino
  real (importar el enlace iCal del anuncio) y sus limitaciones están
  documentados en [`src/lib/airbnb/README.md`](src/lib/airbnb/README.md).
- **Premium se puede encender y apagar** desde `/premium` con la cuenta del
  arrendador, para enseñar el antes y el después. En producción ese cambio lo
  dispararía el cobro.
- **Las imágenes se guardan como data URL** en la base de datos: el logo de la
  marca y los comprobantes de pago. Antes de subirse, los comprobantes se
  reescalan y recomprimen a JPEG en el navegador
  ([`src/lib/images.ts`](src/lib/images.ts)), así una foto de celular de 5 MB
  acaba pesando unos 200 KB. Para producción esto debe moverse a un
  almacenamiento de archivos (Vercel Blob o S3) y dejar en la base solo la ruta.
- **Todos los datos son ficticios.**

## Despliegue en Vercel

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. Configura `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET` en el proyecto.
3. El `postinstall` ya ejecuta `prisma generate`. Las tablas se crean con
   `npm run db:push` y los datos con `npm run db:seed` (ambos apuntan a la misma
   base de Neon, así que basta con haberlos corrido una vez desde tu máquina).

## Despliegue en Render

El repositorio incluye [`render.yaml`](render.yaml), así que no hay que
configurar nada a mano:

1. En Render: **New > Blueprint**, elige el repositorio y aplica el blueprint.
2. Render pedirá `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET` (están marcadas
   `sync: false` para que los secretos no vivan en el repositorio).
3. Construye con `npm ci && npm run build` y arranca con `npm run start`. El
   `postinstall` genera el cliente de Prisma; `next start` escucha en el `PORT`
   que asigna Render.

Las tablas y los datos no se crean en el despliegue: corre `npm run db:push` y
`npm run db:seed` una vez desde tu máquina contra la misma base de Neon. Se
deja fuera del build a propósito, para que un despliegue no pueda alterar el
esquema de la base en producción.

El build no necesita la base: `getOrganization` cae a la marca por defecto si
no puede leerla ([`src/lib/org.ts`](src/lib/org.ts)). Sin eso, la 404 —que Next
prerenderiza y que hereda los tokens de marca del layout raíz— tumbaba el
despliegue entero cada vez que Neon estaba dormida.

> La base gratuita de Neon se suspende tras un rato de inactividad, y el plan
> gratuito de Render también apaga el servicio cuando no recibe tráfico:
> conviene abrir la demo un par de minutos antes de presentarla para que la
> primera carga no tarde.
