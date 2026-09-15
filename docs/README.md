# Centro de Documentación del Sistema (RentaCore / CARCAR)

Bienvenido al repositorio central de documentación, especificaciones funcionales, modelos de datos, acuerdos comerciales y guías operativas del proyecto.

---

## 🗺️ Mapa de Navegación de la Documentación

```
docs/
├── README.md                                    # Este índice general
│
├── 💼 negocio/                                  # Estrategia de negocio, propuestas y acuerdos
│   ├── propuesta-comercial-carcar.md            # Propuesta comercial para CARCAR como cliente fundador
│   ├── modelo-saas-y-sociedad.md               # Modelo SaaS, planes (Essential a Business) y acuerdo de socios
│   ├── Propuesta_Comercial_CARCAR_Cliente_Fundador.docx
│   └── Resumen_Propuesta_Plataforma_para_Informatico (1).docx
│
├── 🏢 clientes/                                 # Datos, inventarios y contextos de clientes
│   └── carcar/
│       ├── resumen-portafolio.md                # Desglose de 121 unidades (104 MXN + 17 USD)
│       ├── CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx
│       └── carcar-inventory.json                # Inventario estructurado en JSON
│
├── 🏛️ arquitectura/                             # Arquitectura de software, modelo y estándares
│   ├── north-star.md                            # La "Estrella del Norte", aislamiento multi-tenant y reglas
│   ├── alcance-v1-operativo.md                  # Alcance V1 operativo (100% real) vs funcionalidades V2
│   ├── modelo-datos.md                          # Esquema de Prisma, entidades relacionales y diagramas ER
│   └── stack-tecnologico.md                     # Next.js 16, React 19, Tailwind v4, Prisma 7, PostgreSQL
│
└── 🚀 despliegue/                               # Infraestructura, Docker y guías de producción
    ├── vps-deployment-guide.md                  # Guía paso a paso de aprovisionamiento en VPS (Oracle/Hetzner)
    └── infraestructura-y-seguridad.md           # Docker Compose, Caddy TLS 1.3, Cloudflare WAF y respaldos
```

---

## 📚 Secciones Detalladas

### 1. [Estrategia de Negocio y Comercialización](file:///c:/Users/xenon/Desktop/CARCAR/docs/negocio/modelo-saas-y-sociedad.md)
- [**Propuesta Comercial CARCAR**](file:///c:/Users/xenon/Desktop/CARCAR/docs/negocio/propuesta-comercial-carcar.md): Términos de cliente fundador ($2,500 MXN/mes + $7,500 MXN de implementación diferida a 3 meses).
- [**Modelo SaaS y Planes de Suscripción**](file:///c:/Users/xenon/Desktop/CARCAR/docs/negocio/modelo-saas-y-sociedad.md): Tiers de precios (*Essential*, *Growth*, *Pro*, *Business*), regla de producto y acuerdo societario (55/45 o 50/50).
- **Archivos Originales**: [Propuesta Comercial (.docx)](file:///c:/Users/xenon/Desktop/CARCAR/docs/negocio/Propuesta_Comercial_CARCAR_Cliente_Fundador.docx) y [Resumen para Informático (.docx)](file:///c:/Users/xenon/Desktop/CARCAR/docs/negocio/Resumen_Propuesta_Plataforma_para_Informatico%20(1).docx).

### 2. [Clientes y Portafolio Operativo](file:///c:/Users/xenon/Desktop/CARCAR/docs/clientes/carcar/resumen-portafolio.md)
- [**Resumen del Portafolio CARCAR**](file:///c:/Users/xenon/Desktop/CARCAR/docs/clientes/carcar/resumen-portafolio.md): Inventario de 121 unidades totales (104 de renta tradicional en MXN por ~$1,001,782.80 MXN/mes + 17 unidades vacacionales en USD).
- **Archivos de Datos**: [Excel Original de Carga (.xlsx)](file:///c:/Users/xenon/Desktop/CARCAR/docs/clientes/carcar/CARCAR_CARGA_PLATAFORMA_FINAL_2026.xlsx) e [Inventario JSON Procesado](file:///c:/Users/xenon/Desktop/CARCAR/docs/clientes/carcar/carcar-inventory.json).

### 3. [Arquitectura y Estándares de Software](file:///c:/Users/xenon/Desktop/CARCAR/docs/arquitectura/north-star.md)
- [**La "North Star" (Estrella del Norte)**](file:///c:/Users/xenon/Desktop/CARCAR/docs/arquitectura/north-star.md): Principio rector de cero código a medida en el núcleo, clarificación de identidades (SaaS vs Cliente) y directrices para desarrollo con IA.
- [**Alcance Operativo V1 vs Módulos V2**](file:///c:/Users/xenon/Desktop/CARCAR/docs/arquitectura/alcance-v1-operativo.md): Delimitación estricta de las 10 funciones 100% operativas en producción, remoción de opciones de demo y congelamiento temporal de automatizaciones, Airbnb iCal y contratos PDF.
- [**Modelo de Datos Relacional**](file:///c:/Users/xenon/Desktop/CARCAR/docs/arquitectura/modelo-datos.md): Entidades `Organization`, `Building`, `Unit`, `Lease`, `Booking`, `ServiceAccount` y diagramas de relación.
- [**Stack Tecnológico**](file:///c:/Users/xenon/Desktop/CARCAR/docs/arquitectura/stack-tecnologico.md): Next.js 16, React Server Components, Server Actions, PostgreSQL, Jose JWT y Tailwind CSS v4.

### 4. [Despliegue e Infraestructura de Servidores](file:///c:/Users/xenon/Desktop/CARCAR/docs/despliegue/vps-deployment-guide.md)
- [**Guía Paso a Paso de Despliegue en VPS**](file:///c:/Users/xenon/Desktop/CARCAR/docs/despliegue/vps-deployment-guide.md): Configuración de Linux Ubuntu 24.04 en Oracle Cloud / Hetzner, creación de usuario deployer, llaves SSH y Fail2ban.
- [**Infraestructura y Blindaje de Seguridad**](file:///c:/Users/xenon/Desktop/CARCAR/docs/despliegue/infraestructura-y-seguridad.md): Orquestación con Docker Compose, Caddy con TLS 1.3 automático, Cloudflare WAF y política de respaldos automáticos con retención de 30 días.
