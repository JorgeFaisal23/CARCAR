import type {
  BookingSource,
  ChargeStatus,
  LeaseStatus,
  Role,
  ServiceType,
  SplitMode,
  UnitStatus,
  UnitType,
} from "@/generated/prisma/enums";

/**
 * Etiquetas en español y colores de estado. El "semáforo" vive aquí para que
 * verde/ámbar/rojo signifiquen lo mismo en toda la aplicación. Cada estado
 * lleva siempre texto además de color: nunca se comunica solo con color.
 */

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

export const TONE_CLASSES: Record<Tone, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  danger:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900",
  neutral:
    "bg-muted text-muted-foreground border-border",
  info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
};

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-muted-foreground/50",
  info: "bg-sky-500",
};

// ------------------------------------------------------------------ roles

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Arrendador",
  ADMIN: "Administrativo",
  VIEWER: "Consulta",
  TENANT: "Inquilino",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Acceso total, incluida la marca y el plan",
  ADMIN: "Gestiona propiedades, servicios y cobros",
  VIEWER: "Solo puede consultar el calendario",
  TENANT: "Entra al portal a ver su contrato y sus pagos",
};

// ------------------------------------------------------------------ unidades

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  ROOM: "Cuarto",
  APARTMENT: "Departamento",
  STUDIO: "Estudio",
  COMMERCIAL: "Local comercial",
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Ocupada",
  SHORT_TERM: "Renta corta",
  MAINTENANCE: "Mantenimiento",
};

export const UNIT_STATUS_TONES: Record<UnitStatus, Tone> = {
  AVAILABLE: "info",
  OCCUPIED: "success",
  SHORT_TERM: "warning",
  MAINTENANCE: "neutral",
};

// ------------------------------------------------------------------ servicios

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  WATER: "Agua",
  ELECTRICITY: "Luz",
  INTERNET: "Internet",
  MAINTENANCE: "Mantenimiento",
  GAS: "Gas",
  OTHER: "Otro",
};

/** Orden fijo de columnas en la tabla de servicios. */
export const SERVICE_TYPE_ORDER: ServiceType[] = [
  "WATER",
  "ELECTRICITY",
  "INTERNET",
  "MAINTENANCE",
  "GAS",
  "OTHER",
];

export const SPLIT_MODE_LABELS: Record<SplitMode, string> = {
  NONE: "Sin prorrateo",
  EQUAL: "Partes iguales",
  BY_SIZE: "Por metros cuadrados",
};

// ------------------------------------------------------------------ cobros

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PARTIAL: "Parcial",
  OVERDUE: "Vencido",
};

export const CHARGE_STATUS_TONES: Record<ChargeStatus, Tone> = {
  PENDING: "warning",
  PAID: "success",
  PARTIAL: "info",
  OVERDUE: "danger",
};

// ------------------------------------------------------------------ contratos

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Vigente",
  ENDED: "Terminado",
  CANCELLED: "Cancelado",
};

export const LEASE_STATUS_TONES: Record<LeaseStatus, Tone> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  ENDED: "neutral",
  CANCELLED: "danger",
};

// ------------------------------------------------------------------ reservas

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  AIRBNB: "Airbnb",
  DIRECT: "Reserva directa",
  MANUAL: "Registro manual",
};

/**
 * Colores del calendario. Se mantienen fuera del token de marca a propósito:
 * distinguir el origen de una reserva es información, no estilo, y debe seguir
 * siendo legible aunque el arrendador elija un color de marca parecido.
 */
export const BOOKING_SOURCE_CLASSES: Record<BookingSource, string> = {
  AIRBNB: "bg-rose-500 text-white",
  DIRECT: "bg-emerald-600 text-white",
  MANUAL: "bg-slate-500 text-white",
};

export const LEASE_BAR_CLASS = "bg-sky-600 text-white";
