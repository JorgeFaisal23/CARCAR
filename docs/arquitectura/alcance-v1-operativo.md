# Alcance Operativo V1 (Producción) vs Módulos Pospuestos V2

Este documento define la delimitación estricta de funcionalidades operativas vigentes en la versión 1.0 para el cliente fundador CARCAR y futuros arrendadores del SaaS, eliminando cualquier opción de demostración o simulación.

---

## 1. Módulos VIGENTES (Core Operativo 100% Real)

Los siguientes 10 módulos se encuentran completamente operativos, respaldados por la base de datos PostgreSQL, protegidos por el aislamiento multi-tenant (`organizationId`) y listos para producción:

| Módulo | Ruta | Estado | Funcionalidad Operativa Real |
| :--- | :--- | :---: | :--- |
| **Inicio / Dashboard** | `/dashboard` | ✅ **Activo** | KPIs reales calculados desde la BD: ocupación porcentual, ingresos facturados vs cobrados en el mes, rentas vencidas y alertas de servicios pendientes. |
| **Propiedades / Complejos** | `/edificios` | ✅ **Activo** | Catálogo de complejos inmobiliarios (Chichén 124, Chichén 126, Colorines, Bodegas, Moonlight, etc.), creación, edición y detalle. |
| **Unidades Inmobiliarias** | `/unidades` | ✅ **Activo** | Gestión de las **121 unidades** de CARCAR. Soporte multidivisa nativo (`MXN` para las 104 unidades tradicionales y `USD` para las 17 vacacionales), tarifas por mes, noche y semana, metros cuadrados y estados (Disponible, Ocupado, Corta estancia, Mantenimiento). |
| **Calendario Unificado** | `/calendario` | ✅ **Activo** | Vista visual interactiva de ocupación mensual y semanal basada en contratos de arrendamiento y reservas directas reales. |
| **Cobros y Recibos** | `/pagos` | ✅ **Activo** | Registro de cobros de renta (efectivo, transferencia, tarjeta). **Subida real de comprobantes de pago** (cámara o archivo) almacenados en disco/volumen vía `storage.ts`. Estados automatizados: Pendiente, Pagado, Parcial y Vencido. |
| **Servicios y Prorrateos** | `/servicios` | ✅ **Activo** | Administración de cuentas de Agua, Luz, Gas, Internet y Mantenimiento. **Algoritmo matemático real de prorrateo** de recibos de edificio entre departamentos (igualitario o por m² con distribución ponderada de centavos residuales, validado con tests unitarios). |
| **Inquilinos y Arrendamientos** | `/inquilinos` | ✅ **Activo** | Directorio de inquilinos, asignación de unidades, fechas de vigencia de contratos, montos de renta pactada y depósitos en garantía. |
| **Portal del Inquilino** | `/portal` | ✅ **Activo** | Acceso autenticado para inquilinos con rol `TENANT` donde consultan su contrato, estado de cuenta, historial de pagos, desglose de servicios y comprobantes subidos. |
| **Configuración de Marca** | `/configuracion/marca` | ✅ **Activo** | Personalización de identidad para el arrendador (CARCAR viste el panel con su logo, color institucional `#0F766E`, tipografía y bordes). |
| **Equipo y Permisos** | `/equipo` | ✅ **Activo** | Control de acceso basado en roles (`OWNER`, `ADMIN`, `VIEWER`, `TENANT`). |
| **Reportes Financieros** | `/reportes` | ✅ **Activo** | Gráficas de cobranza e ingresos históricos consolidados. |

---

## 2. Funcionalidades Descartadas / Pospuestas para V2 ⏸️

Siguiendo el principio de **cero simulación en producción**, se removieron de la navegación operativa las siguientes 3 características hasta que cuenten con integración externa real:

### A. Sincronización con Airbnb / iCal (`/integraciones`)
- **Motivo de descarte**: La integración anterior simulaba el resultado sin consultar los servidores de Airbnb.
- **Estado**: Desactivada (`SHOW_AIRBNB_INTEGRATION = false`).
- **Roadmap V2**: Se implementará el parser bidireccional de archivos `.ics` vía Webhook/Cron para sincronizar reservas externas de las 17 unidades vacacionales.

### B. Automatizaciones de Cobro por WhatsApp y Email (`/automatizaciones`)
- **Motivo de descarte**: La interfaz previa era una maqueta con botones toggle que no enviaban mensajes.
- **Estado**: Desactivada del menú lateral (`SHOW_AUTOMATIONS = false`).
- **Roadmap V2**: Se conectará con proveedores transaccionales (Resend para correo y Meta Cloud API / Twilio para WhatsApp) para recordatorios 3 días antes del vencimiento y al día siguiente de vencer.

### C. Plantillas y Generación de Contratos PDF (`/contratos`)
- **Motivo de descarte**: La vista mostraba tarjetas de plantillas pero no generaba documentos legales PDF descargables ni firma electrónica.
- **Estado**: Desactivada del menú lateral (`SHOW_CONTRACTS = false`).
- **Roadmap V2**: Se integrará un generador de PDFs (como `@react-pdf/renderer`) para emitir contratos y pagarés firmables con los datos del inquilino y la arrendadora.

---

## 3. Eliminación de Opciones de Demostración

Para garantizar un entorno 100% profesional:
1. **Login de Producción**: Se removió el recuadro de *Cuentas de demostración* (`dueno@demo.mx`, `demo1234`). El acceso ahora se realiza exclusivamente con credenciales reales dadas de alta en el sistema (ej. `admin@carcar.mx` para la cuenta OWNER de CARCAR).
2. **Navegación Limpia**: La barra lateral muestra únicamente herramientas que realizan mutaciones y consultas reales sobre la base de datos.
